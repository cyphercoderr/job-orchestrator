// MongoDB initialization script
/* eslint-disable */
const db = db.getSiblingDB("test-orchestration")

// Create collections
db.createCollection("jobs")

// Create indexes for performance
db.jobs.createIndex({ job_id: 1 }, { unique: true })
db.jobs.createIndex({ app_version_id: 1, status: 1 })
db.jobs.createIndex({ status: 1, priority: -1, createdAt: 1 })
db.jobs.createIndex({ target: 1, status: 1 })

// Create a user for the application
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: [
    {
      role: "readWrite",
      db: "test-orchestration",
    },
  ],
})

print("MongoDB initialization completed")
