module.exports.DDocNode = class DDocNode {
  constructor(type) {
    this.type = type;
    this.children = [];
  }
};

module.exports.StyleNode = class StyleNode {
  constructor(children) {
    this.children = children;
  }
};

module.exports.StyleChildNode = class StyleChildNode {
  constructor(prop, values) {
    this.prop = prop;
    this.values = values;
  }
};

module.exports.MakeNode = class MakeNode {
  constructor(el, style, attr, children) {
    this.el = el;
    this.style = style;
    this.attr = attr;
    this.children = children;
  }
};

module.exports.TextNode = class TextNode {
  constructor(value) {
    this.value = value;
  }
};

module.exports.AttributesNode = class AttributesNode {
  constructor(children) {
    this.children = children;
  }
};

module.exports.AttributesChildNode = class AttributesChildNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
};

module.exports.TemplateNode = class TemplateNode {
  constructor(type, name, child) {
    this.type = type;
    this.name = name;
    this.child = child;
  }
};

module.exports.TemplateGetNode = class TemplateGetNode {
  constructor(name, props) {
    this.name = name;
    this.props = props;
  }
};

module.exports.PropDec = class PropDec {
  constructor(name, ref) {
    this.name = name;
    this.ref = ref;
  }
};

module.exports.Prop = class Prop {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
};

module.exports.ImportNode = class ImportNode {
  constructor(path, name) {
    this.path = path;
    this.name = name;
  }
};

module.exports.UseNode = class UseNode {
  constructor(name) {
    this.name = name;
  }
};
