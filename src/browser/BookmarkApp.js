const {app, Tray, Menu, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const request = require('superagent');//http통신
const getTitle = require('get-title');


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
    this._data = null;
    this._type = 'home';

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
    /*ipcMain.on('type', (event, arg) => {
      console.log(arg);
    })*/
    ipcMain.on('type', this._ipcType.bind(this));
    ipcMain.on('paste', this._ipcPaste.bind(this));
  }
  
  async _ipcPaste(event, arg){
    if(arg.indexOf('https://') > -1 || arg.indexOf('http://') > -1 ){
      let response = null;
      try{
        response = await request.get(arg);
      }catch(err){
        dialog.showErrorBox('경고', 'url은 맞는데, request가 잘못 됬습니다.');
      }

      if(response){
        console.log(response.res.text);
      }
    }else{
      dialog.showErrorBox('경고', '잘못된 url 입니다');
    }
  }

  _ipcType(event, arg){
    this._type = arg;
    this._update();
  }

  _update() {
    const data = this._data.filter(item => item.type == this._type)
    this._win.webContents.send('data', data);
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