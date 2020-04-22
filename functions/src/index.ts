import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Natalija!");
});

exports.updatePost = functions.firestore
    .document('/posts/{id}')
    .onUpdate((change, context) => {
        const id = context.params.id;
        console.log("id is: "+id);
        const newValue = change.after.data();
        if(newValue !== undefined){
            const array = [];
            console.log(String(newValue.title));
            console.log("newValue is not undefined");
            array.push({...change.after.data(), name: 'copy of change'});
            console.log('copy of new value: ' + array[0]);
        }
            
            const promises: any[] = [];
            const favRef = admin.firestore().collection("wishlist").where("postID","==" ,id);
              favRef.get().then(docs => {
                docs.forEach(doc => {
                    console.log("jedan wishlist:");
                    console.log(doc.data());
                    const newFavePost = {
                        postID: id,
                        userID: doc.data().userID,
                        post: newValue,
                        date: doc.data().date,
                        time: doc.data().time,
                        timestamp: doc.data().timestamp
                    };
                    const promise = admin.firestore().collection("wishlist").doc(id+doc.data().userID)
                    .set(newFavePost);
                    promises.push(promise);
                   
                })
                return Promise.all(promises);
            }).catch(error => {   
                console.error();
                return null;
            });

        });
        
exports.updateUser = functions.firestore.document('/users/{id}')
.onUpdate((change, context) => {
    const id = context.params.id;
    console.log("user id updated with id " +id);
    //id of user which posts we should update
     admin.firestore().collection("posts").where("userID", "==", id).get()
    .then(docs => {
        const promises: any[] = [];
        docs.forEach(doc => {
            console.log("post id koji treba da se updejtuje:")
            const newPost = {
                userID: doc.data().userID,
                date: doc.data().date,
                description: doc.data().description,
                imageUri: doc.data().imageUri,
                postID: doc.id,
                price: doc.data().price,
                searchTitle: doc.data().searchTitle,
                title: doc.data().title,
                usersFollowing: doc.data().usersFollowing,
                valute: doc.data().valute,
                user: change.after.data()
            };
            console.log(doc.id);
            console.log(doc.data());
            const promise = admin.firestore().collection("posts").doc(doc.id).set(newPost);
            console.log("post updated");
            promises.push(promise);
        });
        return Promise.all(promises);
    }).catch(error => {   
        console.error();
        return null;
    });
});

exports.deletePost = functions.firestore.document('/posts/{id}')
    .onDelete(document => {
        admin.firestore().collection("wishlist").where("postID", "==", document.id)
            .get().then(documents => {
                const promises: any[] = [];
                documents.forEach(doc => {
                    const promise = admin.firestore().collection("wishlist").doc(doc.id).delete();
                    promises.push(promise);
                });
                return Promise.all(promises);
            }).catch(error => {
                console.error();
                console.log(error);
                return null;
            })
    });


    
    exports.createWishlist = functions.firestore.document('/wishlist/{id}')
    .onCreate((snapshot, context) => {
        const snapshotData = snapshot.data();
        if(snapshotData !== undefined){
            const userWhoWishlisted = snapshotData.userID;
            const postID = snapshotData.postID;
            console.log("User who wishlisted: "+userWhoWishlisted);
            console.log("Post which is wishlisted: "+postID);
            const date = snapshotData.date;
            const time = snapshotData.time;
            console.log(date + " " + time);
            let timestamp: Date;
            timestamp = snapshotData.timestamp;
            console.log("timestamp "+ timestamp);
            let post: {date: string, description: string, imageUri: string,
            postID: string, price: number, title: string, user: {}, userID: string, usersFollowing: string[],
            valute: string };
            post = snapshotData.post;
            const userID = post.userID;
            console.log("userID in post " + userID);
            return admin.firestore().collection("users").doc(userWhoWishlisted)
                .get().then(document => {
                    const userData = document.data();
                    if(userData!==undefined){
                        const username = userData.firstName+" "+userData.lastName;
                        const notification = {
                            from: userWhoWishlisted,
                            date: date,
                            time: time,
                            timestamp: timestamp,
                            title: post.title,
                            username: username,
                            imageUri: post.imageUri,
                            type: "wishlist",
                            usersFollowing: post.usersFollowing.length,
                            seen : false,
                            postID: postID
                        };
                       return admin.firestore().collection("users").doc(userID).collection("notifications")
                       .doc(postID).set(notification).then(added => {
                            return admin.firestore().collection("users").doc(userID).collection("infos")
                            .doc(userID).get().then(doc => {
                                console.log("making info")
                                const infos = doc.data();
                                if(infos!==undefined){
                                    console.log("updating info, adding new notification");
                                    let count: number;
                                    count = infos.unseenCount;
                                    count = count+1;
                                    return admin.firestore().collection("users").doc(userID).collection("infos")
                                    .doc(userID).set({unseenCount: count});
                                }else{
                                    console.log("creating info, adding new notification");
                                    const count: number = 1;
                                    return admin.firestore().collection("users").doc(userID).collection("infos")
                                    .doc(userID).set({unseenCount: count});
                                }
                            });
                        });
                    }
                    return null;
                });
        }
        return null;

    });

    exports.createNotification = functions.firestore.document('users/{id}/notifications/{notID}')
    .onCreate((snapshot, context) => {
            console.log("notification is added");
            const notificationData = snapshot.data();
            if(notificationData!==undefined){
                const userID = context.params.id;
                const postID = context.params.notID;
                console.log("userID "+userID);
                console.log("postID" + postID);
                return admin.firestore().collection("tokens").doc(userID).get()
                .then(token => {
                    const tokenData = token.data();
                    if(tokenData!==undefined){
                        const tokenID = tokenData.token;
                        const payload= {
                            data: {
                                title: "New notification"
                            },
                            notification: {
                                title: "New user is following one of your posts"
                            }
                        };
                        return admin.messaging().sendToDevice(tokenID, payload);
                    }else {
                        return null;
                    }
                });
            }
            return null;

    });