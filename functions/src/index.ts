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
            return  favRef.get().then(docs => {
                docs.forEach(doc => {
                    console.log("jedan wishlist:");
                    console.log(doc.data());
                    const newFavePost = {
                        postID: id,
                        userID: doc.data().userID,
                        post: newValue
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

exports.updateMessage = functions.firestore.document('messages/{id}')
    .onUpdate((change, context) => {
        return null;
    });