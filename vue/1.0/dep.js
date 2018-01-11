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
            // 用了foreach的话已经和原来不是同一个对象了，是拷贝
            sub.update();
        });
    }
};

// 全局的唯一的，每次发生时指向对应的watcher
Dep.target = null;