import React, { useState } from "react";
import { useQuery } from "react-query";
import { Eye, Edit, Search, Plus } from "lucide-react";
import axios from "axios";

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: employees, isLoading, error } = useQuery("employees", async () => {
    const response = await axios.get("/api/employees");
    return response.data;
  });

  const filtered = employees?.filter((emp) =>
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center p-6">Loading employees...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 p-6">Error loading employees.</div>;
  }

  return (
    <div className="p-6 bg-[#fffaf4] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#F63A0F]">Team Members</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#F63A0F] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left">
          <thead className="bg-[#FFE3C0] text-[#F63A0F]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((emp) => (
              <tr key={emp._id} className="border-t border-gray-100">
                <td className="p-3">{emp.firstName} {emp.lastName}</td>
                <td className="p-3">{emp.email}</td>
                <td className="p-3 capitalize">{emp.role || 'Team'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {emp.status || 'active'}
                  </span>
                </td>
                <td className="p-3">{new Date(emp.createdAt).toLocaleDateString()}</td>
                <td className="p-3 flex gap-2">
                  <button className="text-[#F63A0F]"><Eye size={16} /></button>
                  <button className="text-green-600"><Edit size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">No team members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
