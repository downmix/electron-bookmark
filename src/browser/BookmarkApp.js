const {app, Tray, Menu, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const HTML = url.format({
  protocol: 'file',
  pathname: path.join(__dirname, '../../static/index.html')
});

//local 파일경로
const DATA_PATH = path.join(app.getPath('userData'), 'data.json');
console.log(DATA_PATH, '<< [ DATA_PATH ]');
class BookmarkApp{
  constructor(){
    this._tray = null;
    this._win = null;
    app.on('ready', this._ready.bind(this));
  }

  _ready(){
    console.log('ready');
    this._initData();

    console.log(this._data);

  //트레이 설정
    this._tray = new Tray(path.join(__dirname, '../../static/icon.png'));
    this._tray.setContextMenu(this._getTrayMenu());

    //윈도우와 반대
    const eventName = (process.platform === 'win32') ? 'click' : 'right-click';
    this._tray.on(eventName, this._toggle.bind(this));

    //창 위치 지정
    const bounds = this._tray.getBounds();
    const x = bounds.x + Math.round(bounds.width/2) - 200;
    const y = (process.platform === 'win32') ? bounds.y - 400 - 10 : bounds.height + 10;

  // 브라우저 윈도우 설정
    this._win = new BrowserWindow({
      x,
      y,
      width: 400,
      height: 400,
      resizable: false,
      movable: false,
      show: false,
      frame: false,
    });

    this._win.once('ready-to-show', this._update.bind(this));
    this._win.on('blur', () => {
      this._win.hide();
    })
    this._win.loadURL(HTML);
    this._win.webContents.openDevTools();

  //ipc설정
    
  }

  _update() {
    this._win.webContents.send('data', this._data);
  }


  _initData() {
    // 최초실행시 json 생성
    if(!fs.existsSync(DATA_PATH)){
      fs.writeFileSync(DATA_PATH, JSON.stringify([]));
    }

    const data = fs.readFileSync(DATA_PATH);
    this._data = JSON.parse(data.toString());
  }

  _toggle() {
    if(this._win.isVisible()){
      this._win.hide();
    }else{
      this._win.show();
    }
  }

  _getTrayMenu(){
    return Menu.buildFromTemplate([
      {
        label: 'Open',
        click: () => {
          this._win.show();
        }
      },
      {
        label: 'Save',
        submenu: [
          {
            label: 'Home',
            click: () => {

            }
          },
          {
            label: 'Github',
            click: () => {

            }
          }
        ]
      },
      {type: 'separator'},
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      },
      
    ])
  }
}

module.exports = {
  BookmarkApp
};