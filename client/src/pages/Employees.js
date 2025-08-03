import React, { useState } from "react";
import { useQuery } from "react-query";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import axios from "axios";

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: employees, isLoading, error } = useQuery("employees", async () => {
    const response = await axios.get("/api/employees");
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading employees</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((employee) => (
                  <tr key={employee._id}>
                    <td className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {employee.firstName?.[0]}{employee.lastName?.[0]}
                      </div>
                      <span>{employee.firstName} {employee.lastName}</span>
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.department?.name || "N/A"}</td>
                    <td>{employee.position}</td>
                    <td>
                      <span className={`badge ${employee.status === "active" ? "badge-success" : "badge-warning"}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
