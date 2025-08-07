import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Pencil, UploadCloud } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  const dummyUser = {
    firstName: "Aarya",
    lastName: "Shah",
    email: "aarya@startup.com",
    phone: "+91 9876543210",
    dob: "1998-06-20",
    position: "Content Strategist",
    department: "Marketing",
    status: "Active",
    joinDate: "2023-02-15",
    bio: "Creative mind behind branding and strategy. Loves chai and Canva.",
    skills: ["Branding", "Copywriting", "SEO"],
    photo: "", // Placeholder; could be replaced with actual image URL
  };

  const profile = user || dummyUser;

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [profileImage, setProfileImage] = useState(null);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const diff = new Date() - birth;
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfileImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleSave = () => {
    setEditing(false);
    // Later: Save to DB
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 font-sans">
      <div className="bg-[#fff8f3] border border-[#ffd9c1] rounded-xl p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-[#ff3d00]"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#ff3d00] text-white flex items-center justify-center text-4xl font-bold">
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer border border-gray-300">
              <UploadCloud size={16} className="text-[#ff3d00]" />
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-[#d62828]">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-sm text-gray-700">{formData.position} — {formData.department}</p>
            <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">
              {formData.status}
            </span>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="ml-auto text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Pencil size={16} /> {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!editing}
              className="input w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!editing}
              className="input w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Date of Birth</label>
            <input
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
              disabled={!editing}
              className="input w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Age</label>
            <p className="mt-2">{calculateAge(formData.dob)} years</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Date of Joining</label>
            <input
              name="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={handleInputChange}
              disabled={!editing}
              className="input w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#d62828]">Department</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={!editing}
              className="input w-full mt-1"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-[#d62828]">About</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!editing}
            className="textarea w-full mt-1"
            rows={3}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-[#d62828]">Skills</label>
          <input
            name="skills"
            value={formData.skills.join(", ")}
            onChange={(e) =>
              setFormData({ ...formData, skills: e.target.value.split(",") })
            }
            disabled={!editing}
            className="input w-full mt-1"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#ffe3d1] text-[#ff3d00] px-2 py-1 rounded"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>

        {editing && (
          <div className="mt-6 text-right">
            <button
              onClick={handleSave}
              className="bg-[#ff3d00] text-white px-5 py-2 rounded hover:bg-[#d62828]"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
