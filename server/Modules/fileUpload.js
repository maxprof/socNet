'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileUpload = fileUpload;

var _File = require('../Models/File');

var _File2 = _interopRequireDefault(_File);

var _randomstring = require('randomstring');

var _randomstring2 = _interopRequireDefault(_randomstring);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fileUpload(req, type, done) {
    var file_name = _randomstring2.default.generate(6) + new Date().getTime() + req.files.file.name;
    var shortPath = '/../public/uploads/' + type + '/' + file_name;
    var newPath = _path2.default.join(__dirname, '../public/uploads/', type, file_name);
    var model = _File2.default;
    if (req.files.file.data) {
        _fs2.default.writeFile(newPath, req.files.file.data, function (err) {
            console.log("err", err);
            if (err) return done(err);
            var newFile = new model();
            newFile.container = type;
            newFile.original_name = req.files.file.name;
            newFile.name = file_name;
            newFile.size = req.files.file.size;
            newFile.creator = req.user._id;
            newFile.path = shortPath;
            console.log("Calling");
            newFile.save(function (err, sFile) {
                if (err) return done(err);
                if (type == 'avatar') {
                    req.user.avatar = sFile._id;
                    req.user.save();
                    done(null);
                }
            });
        });
    }
}