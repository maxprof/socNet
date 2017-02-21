"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function uploadFile(model, user_id, file, data, type, path, done) {
    var newFile = new model();
    newFile.container = type;
    newFile.original_name = file.name;
    newFile.name = data;
    newFile.size = file.size;
    newFile.creator = user_id;
    newFile.path = path;
    newFile.save(function (err, sFile) {
        if (err) return done(err);
        return done(null, sFile);
    });
}
exports.uploadFile = uploadFile;