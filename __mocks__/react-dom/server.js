const ReactDOM = require('react-dom');

module.exports = {
  renderToString: (element) => {
    const div = document.createElement('div');
    ReactDOM.render(element, div);
    return div.innerHTML;
  },
  renderToStaticMarkup: (element) => {
    const div = document.createElement('div');
    ReactDOM.render(element, div);
    return div.innerHTML;
  }
}; 