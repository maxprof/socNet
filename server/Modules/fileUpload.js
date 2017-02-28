'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileUpload = fileUpload;

var _File = require('../Models/File');

var _File2 = _interopRequireDefault(_File);

var _randomstring = require('randomstring');

var _randomstring2 = _interopRequireDefault(_randomstring);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var upload = require('../Modules/upload');

function fileUpload(req, type, done) {
    console.log(req.files);

    // const file_name =  randomstring.generate(6) + new Date().getTime() + req.files.file.name;
    // const shortPath = `/../public/uploads/${type}/${file_name}`;
    // const newPath = `${__dirname}/../public/uploads/${type}/${file_name}`;
    // const model = File;
    // if (req.files.file.data){
    //     fs.writeFile(newPath, req.files.file.data, err => {
    //         console.log("err", err);
    //         if (err) {return done(err)}
    //         upload.uploadFile(model, req.user._id, req.files.file, file_name, type, shortPath ,(err, file) => {
    //             if (err) return done(err);
    //             if (type == 'avatar') {
    //                 req.user.avatar = file._id;
    //                 req.user.save();
    //             }
    //             done(null, {message: 'File was added!', data: file})
    //         });
    //     });
    // }
}