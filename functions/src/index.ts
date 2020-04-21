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
       
            //const favRef = admin.firestore().collection('wishlist').doc(String(userID)+id);
            
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
                        .add(notification).then(added => {
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


/*
exports.updateMessages = functions.firestore.document('/MessagesSplitCollection/{id}')
    .onUpdate((change, context) => {
        const id: string =  context.params.id;
        const messages = change.after.data()
        let array: { date: string, from: string, message: string, time: string, to: string}[];
        if(messages !== undefined){
             array = messages.messages;
             const newMessage = array[array.length-1];
             const from = array[array.length-1].from;
             const to = array[array.length-1].to;
             console.log("to " +to);
             console.log("from "+ from);
             //imamo to, treba da odemo u njegov chat i postavimo broj novih poruka
             //from se postavlja na nulu broj novih
             //salje se u oba chata, treba da se vidi ciji je post da bi se znalo u kojoj kolekciji je chat
            //let postUserId: string;
            let otherUserId: string;
            let postID: string;
             if(id.includes(to)){
                console.log("found postUserID it is from");
                const index = id.indexOf(to);
                postID = id.substring(0, index);
                console.log("postID is "+postID);
                //postUserId = from;
                otherUserId = to;
            } else {
                console.log("found postUserID it is to");
                const index = id.indexOf(from);
                postID = id.substring(0, index);
                console.log("postID is "+postID);
                //postUserId = to;
                otherUserId = from;
            }

             return admin.firestore().collection('chats').doc(otherUserId).get()
                .then(documentSnapshot => {

                    let chats: {date: string, imageUri:string, otherUserID: string,
                    otherUserName: string; postID: string, postTitle: string, postUserID: string,
                postUserName: string, recentText: { date: string, from: string, 
                    message: string, time: string, to: string}, users:string[], newMessages: number}[];
                   
                    const documentSnapshotData = documentSnapshot.data();

                        if(documentSnapshotData !== undefined){
                            chats = documentSnapshotData.chats;
                            let newMessagesTotal = documentSnapshotData.newMessages;
                            const indexOfChat = chats.findIndex(x => x.postID === postID);
                            if(indexOfChat !== -1){
                                console.log("chat in array of chats")
                                //onda chat vec postoji u nizu chatova
                                const newChat = chats[indexOfChat];
                                //ako je poruka od to usera, nema vise novih, u suprotnom plus jedna
                                if(from === otherUserId){
                                    newMessagesTotal = newMessagesTotal - newChat.newMessages;
                                    newChat.newMessages = 0;

                                }else {
                                    console.log("adding messages");
                                    newMessagesTotal = newMessagesTotal + 1;
                                    newChat.newMessages = newChat.newMessages+1;
                                }
                                newChat.recentText = newMessage;
                                const firstSlice = chats.slice(0, indexOfChat);
                                const secondSlice = chats.slice(indexOfChat+1, chats.length-1);
                                const newArray = [];
                                newArray.push(newChat);
                                const newArrayForDucument = newArray.concat(firstSlice).concat(secondSlice);
                                
                                const newDocument = {
                                    chats: newArrayForDucument,
                                    newMessages: newMessagesTotal
                                };
                                return admin.firestore().collection('chats').doc(otherUserId)
                                .set(newDocument);

                            }else {
                                //chat ne postoji u nizu chatova
                                return null;
                            }
                    }else {
                        //treba napraviti chat
                        return null;
                    }
                })
            
             
        }
        return null;
    });*/


