# Database Reset Guide

## Can I delete all tables/collections and start fresh?

**Yes!** MongoDB will automatically create collections (tables) when you insert data. You can safely delete all collections and the application will recreate them as needed.

## How to Reset Your Database

### Option 1: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Select your database (e.g., `college-marketplace` or your database name)
4. For each collection, click the collection name → Click the trash icon → Confirm deletion
5. Collections will be automatically recreated when users sign up, products are created, etc.

### Option 2: Using MongoDB Shell (mongosh)
```bash
# Connect to your MongoDB instance
mongosh "your-connection-string"

# Switch to your database
use your-database-name

# List all collections
show collections

# Delete all collections (replace with your actual collection names)
db.users.drop()
db.products.drop()
db.conversations.drop()
db.messages.drop()
db.email_verifications.drop()
db.id_verifications.drop()
db.wishlist.drop()
db.notifications.drop()
db.reviews.drop()
db.orders.drop()
db.price_alerts.drop()
db.saved_searches.drop()
db.activity_logs.drop()

# Or delete all collections at once (be careful!)
db.getCollectionNames().forEach(function(collection) {
  db[collection].drop();
})
```

### Option 3: Delete Database Entirely
```bash
# In mongosh
use your-database-name
db.dropDatabase()
```

## What Gets Created Automatically?

When you use the application, these collections will be created automatically:

1. **users** - Created when someone signs up
2. **products** - Created when a product is listed
3. **conversations** - Created when a message is sent
4. **messages** - Created when a message is sent
5. **email_verifications** - Created during signup
6. **id_verifications** - Created when ID is uploaded
7. **wishlist** - Created when items are wishlisted
8. **notifications** - Created when notifications are generated
9. **reviews** - Created when reviews are posted
10. **orders** - Created when purchases are made
11. **price_alerts** - Created when price alerts are set
12. **saved_searches** - Created when searches are saved
13. **activity_logs** - Created when activities are logged

## Important Notes

- **No data loss risk**: Collections are just containers. Deleting them doesn't affect your schema or code.
- **Automatic creation**: MongoDB creates collections on first insert, so you don't need to manually create them.
- **Indexes**: If you've created indexes, you may need to recreate them. Check your code for `createIndex()` calls.
- **Backup first**: If you have important data, export it first:
  ```bash
  mongodump --uri="your-connection-string" --out=/path/to/backup
  ```

## After Reset

1. Start your application: `npm run dev`
2. Sign up a new user - the `users` collection will be created
3. Create a product - the `products` collection will be created
4. Everything else will be created as needed

Your application is designed to work with a fresh database - no manual setup required!

