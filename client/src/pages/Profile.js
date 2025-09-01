import React, { useState, useEffect } from "react";
import axios from "axios";

const Profile = ({ userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    address: "",
    emergencyContact: "",
    photo: ""
  });

  useEffect(() => {
    // Fetch user profile when page loads
    axios.get(`http://localhost:5000/api/employees/${userId}`).then((res) => {
      setFormData(res.data);
    });
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:5000/api/employees/update/${userId}`, formData);
    alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-md rounded-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      {/* Profile Photo */}
      <div className="flex justify-center mb-4">
        <img
          src={formData.photo || "https://via.placeholder.com/100"}
          alt="Profile"
          className="w-24 h-24 rounded-full border-2 border-gray-300"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="employeeId"
          placeholder="Employee ID"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="emergencyContact"
          placeholder="Emergency Contact"
          value={formData.emergencyContact}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="photo"
          placeholder="Profile Photo URL"
          value={formData.photo}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;
