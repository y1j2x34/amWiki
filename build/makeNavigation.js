/**
 * @desc 工作端·创建$navigation导航文件模块
 * @author Tevin
 */

const fs = require('fs');
const mngFolder = require('./manageFolder');

module.exports = {
    /**
     * 刷新导航（创建wiki时）
     * @param {string} editPath - 当前文档的路径
     * @returns {string} library文件夹路径
     */
    refresh: function (editPath) {
        const path = editPath.replace(/\\/g, '/').split('library')[0] + 'library/';
        const [tree, files, folders] = mngFolder.readLibraryTree(path);
        if (!tree) {
            return;
        }
        this.make(path, tree);
        return path;
    },
    /**
     * 创建md导航文件
     * @param {string} path - 文库library文件夹路径
     * @param {object} data - 导航列表数据
     */
    make: function (path, data) {

        if (this._hasDuplicateId(data)) {
            return;
        }
        let errIdHas = false;
        const checkId = (name, path) => {
            if (/^\d+(\.\d+)?[-_](.*?)$/.test(name)) {
                return true;
            } else {
                const text = 'Error File ID!\n排序id仅允许由整数或浮点数构成，并使用连接符或下划线与具体名称相连\n' +
                    '    at path "library/' + path + '"\n' +
                    '    at file "' + name + '"';
                errIdHas = true;
                alert(text);
                return false;
            }
        };
        const checkFileName = (name, path) => {
            if (/^\d+(\.\d+)?[-_](.*?)\.md$/.test(name)) {
                return true;
            } else {
                const errText = 'Error File Name\n文件名须由 “排序id-名称.md” 格式构成\n' +
                    '    at path "library/' + path + '/"\n' +
                    '    at file "' + name + '"';
                alert(errText);
                return false;
            }
        };
        function makeMark(children, folderPath){
            var r = "";
            for(let [childName, child] of Object.entries(children)){
                r += makeSubMark(childName, child, folderPath, "");
            }
            return r;

            function makeSubMark(folderName, folder, parentPath, tab){
                var r = `\n${tab}- **${title(folderName)}**`;
                for(let [childName, child] of Object.entries(folder)){
                    if(!checkId(folderName, path)){
                        continue;
                    }
                    if(child){
                        r += makeSubMark(childName, child, parentPath+"/"+folderName, tab+"    ");
                    }else if(checkFileName(childName, path)){
                        var name = title(childName);
                        r += `\n${tab}    - [${name}](?file=${parentPath}/${folderName}/${childName} "${name}")`;
                    }
                }
                return r;
            }
            function title(dirName){
                return dirName.match(/^\d+(\.\d+)?[-_](.*?)(\.md)?$/)[2];
            }
        }
        let markdown = '';
        markdown += '\n#### [首页](?file=首页 "返回首页")\n';
        for(var name in data){
            var subMd = "\n\n##### " + name;
            subMd += makeMark(data[name], name);
            markdown += subMd;
        }

        if (!errIdHas) {
            fs.writeFileSync(path + '$navigation.md', markdown, 'utf-8');
        }

    },
    //检查重复id
    _hasDuplicateId: function (data) {
        //单层检查
        const check = (obj, path) => {
            const hash = {};
            for (let name in obj) {
                if (obj.hasOwnProperty(name)) {
                    if (!hash[name.split('-')[0]]) {
                        hash[name.split('-')[0]] = name;
                    } else {
                        alert('Duplicate File ID!\n同级目录下存在重复ID：' + name.split('-')[0] + '。\n' +
                            '    at path "library/' + path + '"\n' +
                            '    at file "' + hash[name.split('-')[0]] + '"\n' +
                            '    at file "' + name + '"');
                        return false;
                    }
                }
            }
            return true;
        };
        //是否存在重复id
        let duplicate = 'none';
        //第一层，library直接子级
        if (check(data, '')) {
            for (let p1 in data) {
                if (data.hasOwnProperty(p1) && data[p1]) {
                    //第二层，可能是文件夹也可能是文件
                    if (check(data[p1], p1 + '/')) {
                        for (let p2 in data[p1]) {
                            if (data[p1].hasOwnProperty(p2) && data[p1][p2]) {
                                //第三层，只有文件
                                if (!check(data[p1][p2], p1 + '/' + p2 + '/')) {
                                    duplicate = 'yes';
                                    break;
                                }
                            }
                        }
                    } else {
                        duplicate = 'yes';
                        break;
                    }
                }
            }
        } else {
            duplicate = 'yes';
        }
        return duplicate === 'yes';
    }
};