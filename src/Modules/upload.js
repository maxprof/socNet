function uploadFile(model, user_id, file, data, type, path ,done){
    const newFile = new model();
    newFile.container = type;
    newFile.original_name = file.name;
    newFile.name = data;
    newFile.size = file.size;
    newFile.creator = user_id;
    newFile.path = path;
    newFile.save((err, sFile) => {
        if (err) return done(err);
        return done(null, sFile);
    });
}
export {uploadFile};