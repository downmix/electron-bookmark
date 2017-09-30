class BookmarkView {
  constructor(){
    this._btnHome = document.querySelector('#btn_home');
    this._btnGithub = document.querySelector('#btn_github');

    //DOM 이벤트 함수를 바인딩
    this._bindDomEvent();

    //IPC 이벤트 함수를 바인딩
    this._bindIpcEvent();
  }

  _bindDomEvent(){

  }

  _bindIpcEvent(){
    
  }
}

module.exports = {
  BookmarkView
}