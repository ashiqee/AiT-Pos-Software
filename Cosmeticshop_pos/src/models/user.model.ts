import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
  name: string;
  email?: string;
  mobileNo?: string;
  studentId?: string;
  profilePic?: string;
  password?: string;
  isDeleted: boolean;
  status: "active" | "inactive";
  role: "super-admin" | "admin" | "manager" | "salesmen" | "customer";
  designation?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    designation: { type: String },
    profilePic: { type: String },
    email: { type: String, unique: true, sparse: true },
    studentId: { type: String, unique: true, sparse: true },
    mobileNo: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "active",
    },
    isDeleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["super-admin", "admin", "manager", "salesmen", "customer"],
      required: true,
    },
  },
  { timestamps: true }
);



// 🚫 Remove password from JSON response
UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
