/**
 * 监听者
 */
function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    walk: function(data) {
        var self = this;

        Object.keys(data).forEach(function(key) {
            self.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val);
    },
    defineReactive: function(data, key, val) {
        // 监听子属性
        var childObj = observe(val);
        // 每一个属性都有它自己的订阅者
        var dep = new Dep();

        Object.defineProperty(data, key, {
            // 可枚举
            enumerable: true,
            // 不可再被定义
            configurable: false,
            get: function() {
                // 添加订阅者watcher到主题对象Dep
                dep.depend();

                return val;
            },
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 作为发布者，发出通知
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }
    
    return new Observer(value);
}

var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

// 不care原本的一些原型方法，所以直接切断
// 这里面放一些观察者
Dep.prototype = {
    depend: function() {
        if (Dep.target) {
            // 实质上是调用了watcher的addDep
            Dep.target.addDep(this);
        }
    },
    addSub: function(sub) {
        this.subs.push(sub);
    },
    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            // 通知每一个观察者更新了
            sub.update();
        });
    }
};

Dep.target = null;