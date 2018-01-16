/**
 * 数据绑定的入口，整合Observer、Compile和Watcher三者
 * 1. 通过Observer来监听自己的model数据变化
 * 2. 通过Compile来解析编译模板指令
 * 3. 最终利用Watcher搭起Observer和Compile之间的通信桥梁
 * 达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果
 */

var Compile = window.Compile;
var observe = window.observe;
var Watcher = window.Watcher;

function Vue(options) {
    this.$options = options;
    this._data = this.$options.data;
    
    var data = this._data;
    var self = this;
    
    // 属性代理，实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key) {
        self._proxyData(key);
    });
    
    // 钩子函数
    this._initComputed();
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}

Vue.prototype = {
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },
    _proxyData: function(key) {
        var self = this;
        
        Object.defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return self._data[key];
            },
            set: function proxySetter(newVal) {
                self._data[key] = newVal;
            }
        });
    },
    _initComputed: function() {
        var self = this;
        var computed = this.$options.computed;
        
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function(key) {
                Object.defineProperty(self, key, {
                    get: typeof computed[key] === 'function' 
                            ? computed[key] 
                            : computed[key].get,
                    set: function() {}
                });
            });
        }
    }
};
