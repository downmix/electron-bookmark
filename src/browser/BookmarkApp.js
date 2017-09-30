const {app, Tray, Menu, BrowserWindow, ipcMain, dialog, clipboard} = require('electron');
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
    ipcMain.on('remove', this._ipcRemove.bind(this));
  }

  _ipcRemove(event, arg){
    let index = null;
    // 타입을 골라내고
    this._data.filter((item, i) => {
      item.index = i;
      return item.type === this._type;
    }).forEach((item, i) => {
      // 골라낸 것의 인덱스를 찾아서
      if(i === arg){
        index = item.index;
      }
    });

    // this._data 인덱스를 제거
    this._data.splice(index, 1);

    // 파일로 저장
    fs.writeFileSync(DATA_PATH, JSON.stringify(this._data));

    // 업데이트
    this._update();
  }
  
  _ipcPaste(event, arg){
    this._saveUrl(this._type, arg);
  }

  async _saveUrl(type, copiedUrl){
    if(copiedUrl.indexOf('https://') > -1 || copiedUrl.indexOf('http://') > -1 ){
      let response = null;
      try{
        response = await request.get(copiedUrl);
      }catch(err){
        dialog.showErrorBox('경고', 'url은 맞는데, request가 잘못 됬습니다.');
      }

      if(response){
        const title = await getTitle(response.res.text);
        const item = {
          url: copiedUrl,
          title,
          type
        }

        this._data.push(item);
        fs.writeFileSync(DATA_PATH, JSON.stringify(this._data));

        if(type === this._type){
          //업데이트 할 필요없는 창에서는 안한다
          this._update();
        }
        
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
              //ignored 코딩스텐다스. async, await 사용할때 비동기 처리를 무시하기 위해 사용
              const ignored = this._saveUrl('home', clipboard.readText());
            }
          },
          {
            label: 'Github',
            click: () => {
              const ignored = this._saveUrl('github', clipboard.readText());
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