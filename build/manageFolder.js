/**
 * @desc 工作端·文件夹管理模块
 * @author Tevin
 */

const fs = require('fs');

module.exports = {
    /**
     * 读取文库library文件夹树形数据
     * @param {string} path - 文库library文件夹路径
     * @returns {object} 树形数据、文件列表数据、文件夹列表数据
     */
    readLibraryTree: function(path){
        if (!/library[\\\/]$/.test(path)) {
            console.warn('The path is not a library.');
            return [];
        }
        const tree = {};
        const folders = [];
        const files = [];
        const limitedLevel = 4;
        iterateDir(path, tree, 1);

        function iterateDir(path, tree, level){
            if(level > limitedLevel){
                console.warn("文件夹层数超过限制的"+limitedLevel+"层， 已忽略：" + path);
                return;
            }
            try{
                var dir = fs.readdirSync(path);
                folders.push(path);

                dir.forEach(name => {
                    var absPath = path + '/' + name;
                    if(/^\./.test(path)){
                        return;
                    }
                    try{
                        if(fs.statSync(absPath).isDirectory(absPath)){
                            tree[name] = {};
                            iterateDir(absPath, tree[name], level+1);
                        }else if(level > 1){
                            tree[name] = false;
                            files.push(absPath);
                        }
                    }catch(e){
                        console.error(e);
                    }
                });
            }catch(e){
                console.error(e);
            }
        }
        return [tree, files, folders];
    },
    /**
     * 清空文件夹
     * @param {string} path - 要清空的文件夹
     */
    cleanFolder: function(path) {
        const list = fs.readdirSync(path);
        let path2;
        for (let item of list) {
            path2 = path + '/' + item;
            if (fs.statSync(path2).isDirectory(path2)) {
                if (item.indexOf('.') !== 0) {  //跳过特殊文件夹
                    this.cleanFolder(path2);
                    fs.rmdirSync(path2);
                }
            } else {
                fs.unlinkSync(path2);
            }
        }
    },
    /**
     * 获取上一级目录
     * @param {string} path - 需要计算的文件夹路径
     * @returns {string} 父级文件夹路径
     */
    getParentFolder: function (path) {
        return path.replace(/\\/g, '/').replace(/\/$/, '').replace(/\/[^\/]+$/, '/');
    },
    /**
     * 创建文件夹
     * @param {string} path - 需要创建的文件夹路径
     */
    createFolder: function (path) {
        //先判断父级文件夹是否存在，不存在先创建父级文件夹
        const parentPath = this.getParentFolder(path);
        if (!fs.existsSync(parentPath)) {
            this.createFolder(parentPath);      //向上递归创建父级
            this.createFolder(path);  //创建完父级后再创建本级
        }
        //如果父级已存在，直接创建本级
        else {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, 0o777);
            }
        }
    },
    /**
     * 判断一个文件夹是否为amWiki文库项目
     * @param {string} path - 需要判断的文件夹路径
     * @returns {boolean|string} 否定时返回false，肯定时返回项目根目录的路径
     */
    isAmWiki: function (path) {
        if (!path && typeof path !== 'string') {
            return false;
        }
        path = path.replace(/\\/g, '/');
        path = path.indexOf('library') < 0 ? path : path.split('library')[0];
        path = path.indexOf('config.json') < 0 ? path : path.split('config.json')[0];
        path = path.indexOf('index.html') < 0 ? path : path.split('index.html')[0];
        path += /\/$/.test(path) ? '' : '/';
        let states = [
            fs.existsSync(path + '/library/'),
            fs.existsSync(path + '/amWiki/'),
            fs.existsSync(path + '/config.json'),
            fs.existsSync(path + '/index.html')
        ];
        return states[0] && states[1] && states[2] && states[3] ? path : false;
    }
};