# Firestore rules for new features

The deploy workflow ships **hosting only**, so Firestore security rules are managed in the
Firebase console (Firestore → Rules). Add these `match` blocks inside your existing
`match /databases/{database}/documents { … }` block, then **Publish**.

They assume the helpers your rules likely already have; if not, add them too:

```
function signedIn() { return request.auth != null; }
function isAdmin()  { return signedIn() && request.auth.token.role == "admin"; }
```

## Helpdesk (`complaints`)

Residents create and read their own requests; admins read all and update status/notes.
Residents can't change status or edit someone else's request.

```
match /complaints/{id} {
  allow read: if isAdmin()
              || (signedIn() && resource.data.uid == request.auth.uid);

  allow create: if signedIn()
                && request.resource.data.uid == request.auth.uid
                && request.resource.data.status == "open"
                && request.resource.data.title is string
                && request.resource.data.title.size() >= 4
                && request.resource.data.title.size() <= 80
                && request.resource.data.description.size() <= 1000;

  allow update: if isAdmin()
                && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(["status", "adminNote", "updatedAt", "resolvedAt"]);

  allow delete: if false;
}
```

## Contacts (`contacts`)

Every signed-in resident can read the directory; only admins can change it.

```
match /contacts/{id} {
  allow read: if signedIn();
  allow write: if isAdmin();
}
```

Until these are published, the Helpdesk and Contacts screens show a friendly
"you don't have access yet" message instead of failing silently.
