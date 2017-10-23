const {DOMParser} = require('xmldom');


class Plugin {
  apply(o) {
    const re = /\.wxml$/;
    if (!re.test(o.file)) {
      return o.next();
    }

    o.code = transform(o.file, o.code);
    o.next();
  }
}


function transform(path, code) {
  const xml = new DOMParser();
  const root = xml.parseFromString(code);
  transformNode(root, []);
  return toString(root);
}


function transformNode(node, names) {
  const nodeType = node.nodeType;
  if (nodeType === 1) {  // element_node
    transformElement(node, names);
    if (node.getAttribute('wx:for')) {
      const name = node.getAttribute('wx:for-item') || 'item';
      if (name && /^\w+$/.test(name)) {
        names = names.concat([name]);
      }
    }
  } else if (nodeType === 3) { // text-node
    transformText(node, names);
  }
  Array.from(node.childNodes || []).forEach(child => transformNode(child, names))
}


function transformElement(node, names) {
  Array.from(node.attributes).forEach(attr => {
    const value = node.getAttribute(attr.name);
    node.setAttribute(attr.name, transformValue(value, names));
  });
}


function transformText(node, names) {
  const data = transformValue(node.data, names)
  node.replaceData(0, node.data.length, data);
}


function transformValue(value, names) {
  const regExpr = /\{\{((([^'"{}]+)|('[^']*')|("[^"]*"))+)\}\}/g;
  return names.reduce((acc, name) => {
    const regName = new RegExp(`(\\$\\w+)+\\$${name}`, 'g');
    return value.replace(regExpr, (all) => {
      return all.replace(regName, name);
    });
  }, value ||'')
}


function toString(node) {
  const content = node.toString();
  return content
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/, '"')
}


module.exports = Plugin;
