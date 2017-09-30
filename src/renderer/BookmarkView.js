const {ipcRenderer, clipboard} = require('electron');

class BookmarkView {
  constructor(){
    this._btnHome = document.querySelector('#btn_home');
    this._btnGithub = document.querySelector('#btn_github');
    this._dataDom = document.querySelector('#data');


    //DOM 이벤트 함수를 바인딩
    this._bindDomEvent();

    //IPC 이벤트 함수를 바인딩
    this._bindIpcEvent();
  }

  _bindDomEvent(){
    this._btnHome.addEventListener('click', () => {
      this._changeType('home');
    })
    this._btnGithub.addEventListener('click', () => {
      this._changeType('github');
    })
    document.addEventListener('paste', () => {
      const text = clipboard.readText();

      ipcRenderer.send('paste', text);
    })
  }

  _bindIpcEvent(){
    ipcRenderer.on('data', (event, arg) => {
      this._dataDom.innerHTML = this._getHtml(arg);

      for(const item of arg){
        console.log(item.title);
      }

    })
  }

  _getHtml(data) {
    return data.map(item => {
      return `
        <li class="list-group-item">
          <div class="media-body">
              <strong><a href="#" class="clickLink">${item.url}</a></strong>
              <p>
                ${item.title}
                <span class="icon icon-trash pull-right"></span>
              </p>
          </div>
        </li>
      `
    }).join('');
  }

  _changeType(type){
    if(type === 'home'){
      this._btnHome.classList.add('active');
      this._btnGithub.classList.remove('active');
    }else if(type === 'github'){
      this._btnHome.classList.remove('active');
      this._btnGithub.classList.add('active');
    }

    ipcRenderer.send('type', type);
  }
}

module.exports = {
  BookmarkView
}