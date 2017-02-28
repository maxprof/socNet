import File from '../Models/File';
import randomstring from "randomstring";
import fs from 'fs';
const upload = require('../Modules/upload');

export function fileUpload(req, type, done) {
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