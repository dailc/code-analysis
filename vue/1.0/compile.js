/**
 * 解析模版指令
 * 1. 将模板中的变量替换成数据
 * 2. 初始化渲染页面视图
 * 3. 将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图
 */
var Watcher = window.Watcher;

function Compile(node, vm) {
    this.$vm = vm;
    this.$node = this.isElementNode(node) ? node : document.querySelector(node);

    if (this.$node) {
        this.$fragment = this.node2Fragment(this.$node);
        this.init();
        this.$node.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function(node) {
        var fragment = document.createDocumentFragment();
        var child;
        
        // 将原生节点拷贝到fragment
        while ((child = node.firstChild)) {
            fragment.appendChild(child);
        }
        
        return fragment;
    },
    init: function() {
        this.compileElement(this.$fragment);
    },
    compileElement: function(node) {
        var childNodes = node.childNodes;
        var self = this;
        
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            // {{}}对应的正则表达式文本
            var reg = /\{\{(.*)\}\}/;
            
            // 按元素节点方式编译
            if (self.isElementNode(node)) {
                self.compile(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, RegExp.$1);
            }
            
            if (node.childNodes && node.childNodes.length) {
                // 递归编译
                self.compileElement(node);
            }
        });
    },
    compile: function(node) {
        var nodeAttrs = node.attributes;
        var self = this;
        
        // 遍历所有的属性
        [].slice.call(nodeAttrs).forEach(function(attr) {
            var attrName = attr.name;
            
            if (self.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                
                // 事件指令，注意，此时v-已经去除了
                if (self.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, self.$vm, exp, dir);
                } else {
                    // 普通指令
                    compileUtil[dir] && compileUtil[dir](node, self.$vm, exp);
                }
                
                // 指令执行完毕后需移除
                node.removeAttribute(attrName);
            }
        });
    },
    compileText: function(node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },
    // 是否是指令
    isDirective: function(attr) {
        return /^v-/.test(attr);
    },
    // 是否是事件指令
    isEventDirective: function(dir) {
        return /^on/.test(dir);
    },
    // 元素节点
    isElementNode: function(node) {
        return node.nodeType == 1;
    },
    // 文本节点
    isTextNode: function(node) {
        return node.nodeType == 3;
    }
};

// 编译处理工具集合
var compileUtil = {
    
    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    
    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model: function(node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var self = this;
        var val = this._getVMVal(vm, exp);
            
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            
            if (val === newValue) {
                return;
            }
            self._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },
    bind: function(node, vm, exp, dir) {
        var updaterFn = updater[dir + 'Updater'];

        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },
    
    // 事件处理
    eventHandler: function(node, vm, exp, dir) {
        var eventType = dir.split(':')[1];
        var fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    
    _getVMVal: function(vm, exp) {
        var val = vm;
        
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm;
        
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};


// 更新者
var updater = {
    // 文本更新
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // html更新
    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    // css的class
    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = (className && String(value)) ? ' ' : '';

        node.className = className + space + value;
    },
    // 节点值
    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};