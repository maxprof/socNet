export function repost(model, obj, user, done) {
    model
        .findById(obj)
        .exec((err, object) => {
            if (err) return done(err.message);
            if (object.repost_persons.indexOf(user) == -1){
                object.repost_persons.push(user);
                object.repost_count++;
                object.save();
                return done(null);
            } else {
                const index = object.repost_persons.indexOf(user);
                object.repost_persons.splice(index,1);
                object.repost_count--;
                object.save();
                return done(null);
            }
        })
}