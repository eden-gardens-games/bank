// AdminPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";

// MUI & Tailwind hybrid components
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText, Divider,
  Box, Button, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Utility functions
const getNextMonth = (dateStr) => {
  let [month, year] = dateStr.split('/').map(Number);
  return month === 12 ? `1/${year + 1}` : `${month + 1}/${year}`;
};

const getMonthDiff = (start, end) => {
  let [sm, sy] = start.split('/').map(Number);
  let [em, ey] = end.split('/').map(Number);
  return (ey - sy) * 12 + (em - sm);
};

const getFirstOfMonth = (monthYear) => {
  let [month, year] = monthYear.split('/').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US');
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  // Drawer content: links to AdminProfile, AdminUpdate, and AdminPayments
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        <ListItem button onClick={() => navigate("/adminProfile")}>
          <ListItemText primary="Profile" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => navigate("/adminUpdate")}>
          <ListItemText primary="Update Records" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => navigate("/adminPayments")}>
          <ListItemText primary="Approve Payments" />
        </ListItem>
      </List>
    </Box>
  );

  // Processing state
  const [processingDone, setProcessingDone] = useState(false);
  const [adminData, setAdminData] = useState(null); // Admin document from 'bank'
  const [userDocs, setUserDocs] = useState([]); // All documents from 'bank' except Admin

  // For summary dropdown (years)
  const [selectedYear, setSelectedYear] = useState(2025);

  // Fetch and process documents from 'bank'
  useEffect(() => {
    const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' });
    const fetchAndProcessDocs = async () => {
      try {
        // Get Admin document
        const adminDocRef = doc(db, "bank", "Admin");
        const adminSnap = await getDoc(adminDocRef);
        if (adminSnap.exists()) {
          setAdminData(adminSnap.data());
        }

        // Get all user documents (exclude "Admin")
        const bankCollectionRef = collection(db, "bank");
        const snapshot = await getDocs(bankCollectionRef);
        const processedDocs = [];

        // Process each document (asynchronously, then wait briefly)
        for (const docSnap of snapshot.docs) {
          if (docSnap.id === "Admin") continue;
          let data = docSnap.data();
          // If lastUpdate is not current, process loan updates
          if (data.lastUpdate !== currentMonthYear && data.loans && Array.isArray(data.loans)) {
            let updatedLoans = data.loans.map(loan => {
              if (loan.loanStatus === "Progress") {
                const monthsDiff = getMonthDiff(data.lastUpdate, currentMonthYear);
                let currMonth = data.lastUpdate;
                for (let i = 0; i < monthsDiff; i++) {
                  currMonth = getNextMonth(currMonth);
                  loan.loanPayments = loan.loanPayments ? [...loan.loanPayments, loan.loanCurrEMI] : [loan.loanCurrEMI];
                  loan.loanPayDays = loan.loanPayDays ? [...loan.loanPayDays, getFirstOfMonth(currMonth)] : [getFirstOfMonth(currMonth)];
                  loan.loanPayStatus = loan.loanPayStatus ? [...loan.loanPayStatus, "Pending"] : ["Pending"];
                  const interestPayment = (loan.loanCurrBal * loan.loanCurrInt / 1200);
                  loan.loanPayInts = loan.loanPayInts ? [...loan.loanPayInts, interestPayment] : [interestPayment];
                  // Update current balance and duration (simplified)
                  loan.loanCurrBal = loan.loanCurrBal * (1 + (loan.loanCurrInt / 1200)) - loan.loanCurrEMI;
                  loan.loanCurrDur = loan.loanCurrDur - 1;
                  if (loan.loanCurrDur <= 0 || loan.loanCurrBal <= 0) {
                    loan.loanStatus = "Closed";
                    break;
                  }
                }
              }
              return loan;
            });
            // Update Firestore for the user
            const userDocRef = doc(db, "bank", docSnap.id);
            await updateDoc(userDocRef, {
              loans: updatedLoans,
              lastUpdate: currentMonthYear
            });
            data.loans = updatedLoans;
            data.lastUpdate = currentMonthYear;
          }
          processedDocs.push({ id: docSnap.id, ...data });
        }
        // Wait a moment for async updates to finish
        setTimeout(() => {
          setUserDocs(processedDocs);
          setProcessingDone(true);
        }, 2000);
      } catch (err) {
        console.error("Error fetching or processing docs:", err);
      }
    };
    fetchAndProcessDocs();
  }, []);

  // Calculate summary metrics from userDocs (for docs except Admin)
  const calculateSummaryMetrics = () => {
    let paidOff = 0, outstanding = 0, monthlyDeposit = 0, ytdInterest = 0, ytdPrincipal = 0;
    userDocs.forEach(user => {
      if (user.loans && Array.isArray(user.loans)) {
        user.loans.forEach(loan => {
          if (loan.loanStatus === "Progress") {
            if (loan.loanPayments && Array.isArray(loan.loanPayments)) {
              paidOff += loan.loanPayments.reduce((acc, curr) => acc + Number(curr), 0);
            }
            outstanding += Number(loan.loanCurrBal || 0);
            monthlyDeposit += Number(loan.loanCurrEMI || 0);
          }
          // YTD calculations (for all loans, active and inactive)
          if (loan.loanPayDays && loan.loanPayments && loan.loanPayInts && Array.isArray(loan.loanPayDays)) {
            loan.loanPayDays.forEach((day, index) => {
              const yearPart = new Date(day).getFullYear();
              if (yearPart === Number(selectedYear)) {
                ytdInterest += Number(loan.loanPayInts[index] || 0);
                ytdPrincipal += Number(loan.loanPayments[index] || 0);
              }
            });
          }
        });
      }
    });
    ytdPrincipal = ytdPrincipal - ytdInterest;
    return { paidOff, outstanding, monthlyDeposit, ytdInterest, ytdPrincipal };
  };

  const { paidOff, outstanding, monthlyDeposit, ytdInterest, ytdPrincipal } = calculateSummaryMetrics();

  // Generate array of years for dropdown (2000 to 2100)
  const years = [];
  for (let y = 2000; y <= 2100; y++) {
    years.push(y);
  }

  // Build table data: Active loans from all userDocs
  const activeLoans = [];
  userDocs.forEach(user => {
    if (user.loans && Array.isArray(user.loans)) {
      user.loans.forEach(loan => {
        if (loan.loanStatus === "Progress") {
          activeLoans.push({
            user: user.firstName,
            loanId: loan.loanId,
            loanAmount: loan.loanPrincipal,
            paidOff: loan.loanPayments ? loan.loanPayments.reduce((acc, curr) => acc + Number(curr), 0) : 0,
            balance: loan.loanCurrBal
          });
        }
      });
    }
  });

  // Logout handler for admin
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!processingDone) {
    return (
      <div className="min-h-screen w-full bg-blue-900 text-white flex justify-center items-center">
        <Typography variant="h5">Processing Data, please wait...</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-blue-900 text-white">
      {/* App Bar */}
      <AppBar position="static" className="bg-blue-900">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Wisemen Financials
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Welcome, Admin!
            </Typography>
            <AccountCircleIcon />
          </Box>
        </Toolbar>
      </AppBar>
      {/* Drawer Sidebar */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>

      {/* Summary Box */}
      <Box className="bg-yellow-400 p-4 my-4" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">Bank Balance</Typography>
          <Typography variant="h6">${adminData ? Number(adminData.balance).toFixed(2) : '0.00'}</Typography>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">Paid-off Amount</Typography>
          <Typography variant="h6">${paidOff.toFixed(2)}</Typography>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">Outstanding Balance</Typography>
          <Typography variant="h6">${outstanding.toFixed(2)}</Typography>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">Monthly Deposit</Typography>
          <Typography variant="h6">${monthlyDeposit.toFixed(2)}</Typography>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <FormControl variant="outlined" size="small" className="w-32">
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">YTD Interest</Typography>
          <Typography variant="h6">${ytdInterest.toFixed(2)}</Typography>
        </Box>
        <Box className="flex flex-col items-center m-2">
          <Typography variant="subtitle1">YTD Principal</Typography>
          <Typography variant="h6">${ytdPrincipal.toFixed(2)}</Typography>
        </Box>
      </Box>

      {/* Active Loans Table */}
      <Paper className="mx-auto my-4 p-4 bg-white text-black rounded" sx={{ maxWidth: 1000 }}>
        <Typography variant="h6" className="mb-2">Active Loans</Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Loan ID</TableCell>
                <TableCell>Loan Amount</TableCell>
                <TableCell>Paid-off Amount</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeLoans.map((loan, index) => (
                <TableRow key={index} hover>
                  <TableCell>{loan.user}</TableCell>
                  <TableCell>{loan.loanId}</TableCell>
                  <TableCell>${Number(loan.loanAmount).toFixed(2)}</TableCell>
                  <TableCell>${Number(loan.paidOff).toFixed(2)}</TableCell>
                  <TableCell>${Number(loan.balance).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* + Add New Loan Button */}
      <Box className="flex justify-center my-4">
        <Button variant="contained" color="primary" onClick={() => navigate("/adminAddLoan")}>
          + Add new loan
        </Button>
      </Box>
    </div>
  );
};

export default AdminPage;
