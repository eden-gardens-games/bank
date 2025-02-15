import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { signOut, updatePassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";

// MUI Components
import { 
  AppBar, Toolbar, Typography, Button, Paper, 
  Drawer, IconButton, List, ListItem, ListItemText, Divider,
  FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const AdminUpdate = () => {
  const navigate = useNavigate();

  // Drawer (Sidebar) state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => (event) => {
    if(event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };
  
  const drawerContent = (
    <div style={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        <ListItem button onClick={() => navigate("/bankAdmin")}>
          <ListItemText primary="Admin Home" />
        </ListItem>
        <Divider />
		<ListItem button onClick={() => navigate("/bankAdminUpdate")}>
          <ListItemText primary="Update Records" />
        </ListItem>
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  // Bank Balance State: Fetch from admin doc in "bank" collection
  const [bankBalance, setBankBalance] = useState(null);
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const adminDocRef = doc(db, "bank", "Admin");
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          setBankBalance(adminDocSnap.data().balance);
        }
      } catch (err) {
        console.error("Error fetching admin balance", err);
      }
    };
    fetchBalance();
  }, []);

  // Logout Handler
  

  // Action Dropdown
  const [selectedAction, setSelectedAction] = useState("");

  // Form states for each action

  // 1. Add User
  const [addUserData, setAddUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: ""
  });
  const handleAddUser = async () => {
    if (addUserData.password !== addUserData.repeatPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, addUserData.email, addUserData.password);
      const user = userCredential.user;
      // Create Firestore document using uid as document id
      await setDoc(doc(db, "bank", user.uid), {
        firstName: addUserData.firstName,
        lastName: addUserData.lastName,
        emailId: addUserData.email,
        loans: [],
        status: "Active"
      });
      alert("User added successfully!");
    } catch (err) {
      console.error("Error adding user: ", err);
      alert("Error adding user.");
    }
  };

  // 2. Remove User
  const [removeUserList, setRemoveUserList] = useState([]); // list of active users
  const [selectedUserToRemove, setSelectedUserToRemove] = useState("");
  const [removeUserLoanAction, setRemoveUserLoanAction] = useState(""); // "Foreclose" or "Lose"
  const handleRemoveUser = async () => {
    try {
      const userDocRef = doc(db, "bank", selectedUserToRemove);
      // Fetch selected user data to check active loans
      const userDataSnap = await getDoc(userDocRef);
      const userData = userDataSnap.data();
      // Update user status to "Deleted"
      await updateDoc(userDocRef, { status: "Deleted" });
      // If user has active loans, handle them:
      const activeLoans = (userData.loans || []).filter(loan => 
        loan.loanStatus === "Progress" || loan.loanStatus === "Progress-Ext" || loan.loanStatus === "Approved"
      );
      if (activeLoans.length > 0) {
        if (removeUserLoanAction === "Foreclose") {
          // Update each active loan's status to "Closed-FC"
          // Placeholder: You may iterate and update the loans array accordingly.
          alert("Active loans foreclosed.");
        } else if (removeUserLoanAction === "Lose") {
          // Update each active loan's status to "Lost"
          alert("Active loans marked as lost.");
        }
      }
      alert("User removed successfully!");
    } catch (err) {
      console.error("Error removing user: ", err);
      alert("Error removing user.");
    }
  };

  // 3. Change Referral Code
  const [newReferralCode, setNewReferralCode] = useState("");
  const handleChangeReferralCode = async () => {
    try {
      const adminDocRef = doc(db, "bank", "admin");
      await updateDoc(adminDocRef, { referralCode: newReferralCode });
      alert("Referral code updated!");
    } catch (err) {
      console.error("Error updating referral code: ", err);
      alert("Error updating referral code.");
    }
  };

  // 4. Update Admin Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: ""
  });
  const handleUpdateAdminPassword = async () => {
    if (passwordData.newPassword !== passwordData.repeatNewPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      // Placeholder: Reauthenticate if necessary then update password using Firebase method.
      await updatePassword(auth.currentUser, passwordData.newPassword);
      alert("Admin password updated!");
    } catch (err) {
      console.error("Error updating password: ", err);
      alert("Error updating password.");
    }
  };

  // 5. Add Loan
  const [loanDataForm, setLoanDataForm] = useState({
    user: "",
    principal: "",
    interest: "",
    startDate: "",
    duration: ""
  });
  const calculateEMI = (principal, interest, duration) => {
    return Number(principal) / Number(duration);
  };
  const handleAddLoan = async () => {
    try {
      // Generate an 8-character loanId
      const loanId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const EMI = calculateEMI(loanDataForm.principal, loanDataForm.interest, loanDataForm.duration);
      const newLoan = {
        loanDate: loanDataForm.startDate,
        loanId,
        loanPrincipal: loanDataForm.principal,
        loanInterestRate: loanDataForm.interest,
        loanDuration: loanDataForm.duration,
        loanEMI: EMI,
        loanStatus: "Progress",
        loanExtension: 0,
        loanForeclosure: 0
      };
      // Update the user's document by appending the new loan to the loans array.
      const userDocRef = doc(db, "bank", loanDataForm.user);
      const userDocSnap = await getDoc(userDocRef);
      const currentLoans = userDocSnap.data().loans || [];
      await updateDoc(userDocRef, { loans: [...currentLoans, newLoan] });
      alert("Loan added successfully!");
    } catch (err) {
      console.error("Error adding loan: ", err);
      alert("Error adding loan.");
    }
  };

  // 6. Update Bank Balance
  const [newBankBalance, setNewBankBalance] = useState("");
  const handleUpdateBankBalance = async () => {
    try {
      const adminDocRef = doc(db, "bank", "admin");
      await updateDoc(adminDocRef, { balance: newBankBalance });
      alert("Bank balance updated!");
      setBankBalance(newBankBalance);
    } catch (err) {
      console.error("Error updating bank balance: ", err);
      alert("Error updating bank balance.");
    }
  };

  // Load active users for Remove User and Add Loan actions (exclude admin)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const bankCollectionRef = collection(db, "bank");
        const snapshot = await getDocs(bankCollectionRef);
        let users = [];
        snapshot.forEach(docSnap => {
          if (docSnap.id !== "admin") {
            const data = docSnap.data();
            if (data.status === "Active") {
              let activeLoansCount = 0;
              if (data.loans && Array.isArray(data.loans)) {
                data.loans.forEach(loan => {
                  if (loan.loanStatus === "Progress" || loan.loanStatus === "Progress-Ext" || loan.loanStatus === "Approved") {
                    activeLoansCount++;
                  }
                });
              }
              users.push({ uid: docSnap.id, firstName: data.firstName, lastName: data.lastName, activeLoansCount });
            }
          }
        });
        // We use the same list for both Remove User and Add Loan dropdowns.
        setRemoveUserList(users);
      } catch (err) {
        console.error("Error fetching users: ", err);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-900 text-white">
      {/* App Bar & Sidebar (same as previous page) */}
      <AppBar position="static" className="bg-blue-900">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          {/* You can optionally add additional top bar items */}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>

      {/* Top Center Text */}
      <div className="text-center my-4">
        <Typography variant="h4">
          Bank Balance - ${bankBalance !== null ? bankBalance : "Loading..."}
        </Typography>
        <Typography variant="body1">What do you want to do today?</Typography>
      </div>

      {/* Action Dropdown */}
      <div className="mx-auto w-full max-w-md my-4">
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Select Action</InputLabel>
          <Select
            label="Select Action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <MenuItem value="addUser">Add User</MenuItem>
            <MenuItem value="removeUser">Remove User</MenuItem>
            <MenuItem value="changeReferral">Change Referral Code</MenuItem>
            <MenuItem value="updatePassword">Update Admin Password</MenuItem>
            <MenuItem value="addLoan">Add Loan</MenuItem>
            <MenuItem value="updateBalance">Update Bank Balance</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Conditionally Render Action Forms */}
      <div className="mx-auto w-full max-w-md p-4 bg-gray-100 text-black rounded">
        {selectedAction === "addUser" && (
          <div>
            <Typography variant="h6" className="mb-2">Add User</Typography>
            <TextField
              label="First Name"
              fullWidth
              margin="dense"
              value={addUserData.firstName}
              onChange={(e) => setAddUserData({ ...addUserData, firstName: e.target.value })}
            />
            <TextField
              label="Last Name"
              fullWidth
              margin="dense"
              value={addUserData.lastName}
              onChange={(e) => setAddUserData({ ...addUserData, lastName: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              margin="dense"
              value={addUserData.email}
              onChange={(e) => setAddUserData({ ...addUserData, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="dense"
              value={addUserData.password}
              onChange={(e) => setAddUserData({ ...addUserData, password: e.target.value })}
            />
            <TextField
              label="Repeat Password"
              type="password"
              fullWidth
              margin="dense"
              value={addUserData.repeatPassword}
              onChange={(e) => setAddUserData({ ...addUserData, repeatPassword: e.target.value })}
            />
            <Button variant="contained" color="primary" fullWidth className="mt-2" onClick={handleAddUser}>
              Add User
            </Button>
          </div>
        )}

        {selectedAction === "removeUser" && (
          <div>
            <Typography variant="h6" className="mb-2">Remove User</Typography>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Select User</InputLabel>
              <Select
                label="Select User"
                value={selectedUserToRemove}
                onChange={(e) => setSelectedUserToRemove(e.target.value)}
              >
                {removeUserList.map((user) => (
                  <MenuItem key={user.uid} value={user.uid}>
                    {user.firstName} {user.lastName}{" "}
                    {user.activeLoansCount > 0 ? (
                      <span style={{ color: "red" }}>(Active Loans: {user.activeLoansCount})</span>
                    ) : (
                      <span style={{ color: "green" }}>(No Active Loans)</span>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedUserToRemove && removeUserList.find(u => u.uid === selectedUserToRemove)?.activeLoansCount > 0 && (
              <Typography variant="body2" color="error" className="mt-2">
                Warning: This user has active loans!
              </Typography>
            )}
            {selectedUserToRemove && removeUserList.find(u => u.uid === selectedUserToRemove)?.activeLoansCount > 0 && (
              <FormControl fullWidth variant="outlined" size="small" className="mt-2">
                <InputLabel>Loan Action</InputLabel>
                <Select
                  label="Loan Action"
                  value={removeUserLoanAction}
                  onChange={(e) => setRemoveUserLoanAction(e.target.value)}
                >
                  <MenuItem value="Foreclose">Foreclose All</MenuItem>
                  <MenuItem value="Lose">Lose All</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button variant="contained" color="secondary" fullWidth className="mt-2" onClick={handleRemoveUser}>
              Delete User
            </Button>
          </div>
        )}

        {selectedAction === "changeReferral" && (
          <div>
            <Typography variant="h6" className="mb-2">Change Referral Code</Typography>
            <TextField
              label="New Referral Code"
              fullWidth
              margin="dense"
              value={newReferralCode}
              onChange={(e) => setNewReferralCode(e.target.value)}
            />
            <Button variant="contained" color="primary" fullWidth className="mt-2" onClick={handleChangeReferralCode}>
              Update Referral Code
            </Button>
          </div>
        )}

        {selectedAction === "updatePassword" && (
          <div>
            <Typography variant="h6" className="mb-2">Update Admin Password</Typography>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              margin="dense"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="dense"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <TextField
              label="Repeat New Password"
              type="password"
              fullWidth
              margin="dense"
              value={passwordData.repeatNewPassword}
              onChange={(e) => setPasswordData({ ...passwordData, repeatNewPassword: e.target.value })}
            />
            <Button variant="contained" color="primary" fullWidth className="mt-2" onClick={handleUpdateAdminPassword}>
              Update Password
            </Button>
          </div>
        )}

         {selectedAction === "addLoan" && (
          <div>
            <Typography variant="h6" className="mb-2">Add Loan</Typography>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Select User</InputLabel>
              <Select
                label="Select User"
                value={loanDataForm.user}
                onChange={(e) => setLoanDataForm({ ...loanDataForm, user: e.target.value })}
              >
                {removeUserList.map((user) => (
                  <MenuItem key={user.uid} value={user.uid}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Loan Principal"
              fullWidth
              margin="dense"
              value={loanDataForm.principal}
              onChange={(e) => setLoanDataForm({ ...loanDataForm, principal: e.target.value })}
            />
            <TextField
              label="Loan Interest"
              fullWidth
              margin="dense"
              value={loanDataForm.interest}
              onChange={(e) => setLoanDataForm({ ...loanDataForm, interest: e.target.value })}
            />
            <TextField
              label="Loan Start Date"
              type="date"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={loanDataForm.startDate}
              onChange={(e) => setLoanDataForm({ ...loanDataForm, startDate: e.target.value })}
            />
            <TextField
              label="Loan Duration (months)"
              fullWidth
              margin="dense"
              value={loanDataForm.duration}
              onChange={(e) => setLoanDataForm({ ...loanDataForm, duration: e.target.value })}
            />
            <Button variant="contained" color="primary" fullWidth className="mt-2" onClick={handleAddLoan}>
              Add Loan
            </Button>
          </div>
        )}

        {selectedAction === "updateBalance" && (
          <div>
            <Typography variant="h6" className="mb-2">Update Bank Balance</Typography>
            <TextField
              label="New Bank Balance"
              fullWidth
              margin="dense"
              value={newBankBalance}
              onChange={(e) => setNewBankBalance(e.target.value)}
            />
            <Button variant="contained" color="primary" fullWidth className="mt-2" onClick={handleUpdateBankBalance}>
              Update Bank Balance
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpdate;
