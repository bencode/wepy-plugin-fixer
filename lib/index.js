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
  transformNode(root);
  return toString(root);
}


function transformNode(node, name) {
  const nodeType = node.nodeType;
  if (nodeType === 1) {  // element_node
    if (node.getAttribute('wx:for')) {
      name = node.getAttribute('wx:for-item') || 'item';
    } else {
      name && transformElement(node, name);
    }
  } else if (nodeType === 3) { // text-node
    if (name) {
      transformText(node, name);
    }
  }
  Array.from(node.childNodes || []).forEach(child => transformNode(child, name))
}


function transformElement(node, name) {
  Array.from(node.attributes).forEach(attr => {
    const value = node.getAttribute(attr.name);
    node.setAttribute(attr.name, transformValue(value, name));
  });
}


function transformText(node, name) {
  const data = transformValue(node.data, name)
  node.replaceData(0, node.data.length, data);
}


function transformValue(value, name) {
  const regExpr = /\{\{((([^'"{}]+)|('[^']*')|("[^"]*"))+)\}\}/g;
  const regName = new RegExp(`(\\$\\w+)+\\$${name}`, 'g');
  return (value || '').replace(regExpr, (all) => {
    return all.replace(regName, name);
  });
}


function toString(node) {
  const content = node.toString();
  return content
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/, '"')
}


module.exports = Plugin;
