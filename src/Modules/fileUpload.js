import File from '../Models/File';
import randomstring from "randomstring";
import path from 'path';
import fs from 'fs';
export function fileUpload(req, type, done) {
    const file_name =  randomstring.generate(6) + new Date().getTime() + req.files.file.name;
    const shortPath = `/../public/uploads/${type}/${file_name}`;
    const newPath = path.join(__dirname,'../public/uploads/', type, file_name);
    const model = File;
    if (req.files.file.data){
        fs.writeFile(newPath, req.files.file.data, err => {
            console.log("err", err);
            if (err) return done(err);
            const newFile = new model();
            newFile.container = type;
            newFile.original_name = req.files.file.name;
            newFile.name = file_name;
            newFile.size = req.files.file.size;
            newFile.creator = req.user._id;
            newFile.path = shortPath;
            console.log("Calling");
            newFile.save((err, sFile) => {
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