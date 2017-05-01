/**
 * @desc 工作端·文库管理模块
 * @author Tevin
 */

const fs = require('fs');
const mngFolder = require('./manageFolder');

module.exports = {
    /**
     * 绑定文库记录
     * @param {object} wikis - 文库记录列表的引用
     */
    linkWikis: function (wikis) {
        this._wikis = wikis;
    },
    /**
     * 添加一个文库到记录
     * @param {string} root - 文库根目录
     * @param {number} [id] - 文库的计算id
     * @return {string} - 文库编号
     */
    addWiki: function (root, id = this.createWikiId(root)) {
        if (typeof root === 'undefined') {
            return;
        }
        if (typeof this._wikis[id] !== 'undefined') {
            return;
        }
        /*
         * 文库信息
         * 一个文库通常包括以下属性
         * id：文库id，由真实地址计算而来，也就是说文库是基于不同地址来管理的
         * root：文库根目录地址
         * path：文库文档地址
         * treeMD5：文件清单md5值，用于检测文库目录树变化
         * deprecated：弃用标记，当文库被删除或转移走后，原有地址标记为弃用
         */
        this._wikis[id] = {
            id: id,
            root: root,
            path: root + 'library/',
            deprecated: false
        };
        return id;
    },
    /**
     * 计算文库id
     * @param {string} root - 需要计算id的文库根目录
     * @returns {number} 文库id，由根目录路径字符串计算而来
     */
    createWikiId: function (root) {
        root = root.replace(/\\/g, '/').replace(/\/$/, '');
        //累加地址字符串每个字符Unicode值与此字符序号的乘积
        let code = 0;
        for (let j = 0; j < root.length; j++) {
            code += root.charCodeAt(j) * j;
        }
        //再与地址字符串长度拼合
        code = parseInt(root.length + '' + code);
        return code;
    },
    /**
     * 判断文库是否加入记录，未加入则补录
     * @param {string} path - 需要判断的路径
     */
    checkAddWiki: function (path) {
        if (path.indexOf('library') > 0) {
            this.addWiki(path.split('library')[0]);
        } else {
            //验证转换 path 为 wiki 根目录
            const root = mngFolder.isAmWiki(path);
            if (root) {
                this.addWiki(root);
            }
        }
    },
    /**
     * 检查文库是否仍然有效，失效则标记弃用
     * @param {number} wId - 需要判断的文库id
     */
    checkWikiValid: function (wId) {
        if (typeof this._wikis[wId] !== 'undefined') {
            const root = this._wikis[wId].root;
            //当文件夹不存在或者文件夹不为amWiki时，标记弃用
            //也就是说，从atom目录树删除项目，并不会标记弃用，必须删除文库本地文件和文件夹
            this._wikis[wId].deprecated = !fs.existsSync(root) || !mngFolder.isAmWiki(root)
        }
    }
};