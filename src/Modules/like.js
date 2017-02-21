export function like(model, obj, user, done) {
    model
        .findById(obj)
        .exec((err, object) => {
        console.log(object.likes_persons);
            if (object.likes_persons.indexOf(user) == -1){
                object.likes_persons.push(user);
                object.likes_count++;
                object.save();
                return done(null, object);
            } else {
                const index = object.likes_persons.indexOf(user);
                object.likes_persons.splice(index,1);
                object.likes_count--;
                object.save();
                return done(null, object);
            }
        })
}