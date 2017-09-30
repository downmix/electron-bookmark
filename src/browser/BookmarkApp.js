const {app} = require('electron');

class BookmarkApp{
  constructor(){
    app.on('ready', this._ready.bind(this));
  }

  _ready(){
    console.log('ready');
  }
}

module.exports = {
  BookmarkApp
};