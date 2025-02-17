// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { signOut, updatePassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";

// MUI Components
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText, Divider,
  Box, Button, FormControl, InputLabel, Select, MenuItem, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Dashboard = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => (event) => {
    if(event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };


  // Logout handler for customer (same as before)
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleProfile = async () => {
    navigate("/custProfile");
  };

  // Drawer content for customer side
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        <ListItem button onClick={() => setSelectedDrawer("PaymentHistory")}>
          <ListItemText primary="Payment History" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => setSelectedDrawer("LoanAgreement")}>
          <ListItemText primary="Loan Agreement" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => setSelectedDrawer("ACHDetails")}>
          <ListItemText primary="ACH Details" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => setSelectedDrawer("LoanPayoff")}>
          <ListItemText primary="Loan Payoff" />
        </ListItem>
		<Divider />
        <ListItem button onClick={handleProfile}>
          <ListItemText primary="Profile" />
        </ListItem>
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );
  // State for current user data
  const [userData, setUserData] = useState(null);
  const [processingDone, setProcessingDone] = useState(false);

  // Fetch current user's document from Firestore based on auth.currentUser.uid
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, "bank", uid);
        const userSnap = await getDoc(userDocRef);
        if(userSnap.exists()){
          const data = userSnap.data();
          setUserData(data);
          // Process loans if needed
          await processLoanUpdates(uid, data);
        }
      } catch (err) {
        console.error("Error fetching user data", err);
      }
    };
    if(auth.currentUser) {
      fetchUserData();
    }
  }, []);


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
  
  // Function to process loan updates if lastUpdate is not current month-year.
  const processLoanUpdates = async (uid, data) => {
    const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' });
    if(data.lastUpdate === currentMonthYear) {
      setProcessingDone(true);
      return;
    }
	
    if(data.loans && Array.isArray(data.loans)){
      const updatedLoans = data.loans.map(loan => {
        if(loan.loanStatus === "Progress"){
          const monthsDiff = getMonthDiff(data.lastUpdate,currentMonthYear);
		  let currMonth = data.lastUpdate;
          for(let i = 0; i < monthsDiff; i++){
			currMonth = getNextMonth(currMonth);
            loan.loanPayments = loan.loanPayments ? [...loan.loanPayments, loan.loanCurrEMI] : [loan.loanCurrEMI];
            loan.loanPayDays = loan.loanPayDays ? [...loan.loanPayDays, getFirstOfMonth(currMonth)] : [getFirstOfMonth(currMonth)];
            loan.loanPayStatus = loan.loanPayStatus ? [...loan.loanPayStatus, "Pending"] : ["Pending"];
            const interestPayment = (loan.loanCurrBal * loan.loanCurrInt / 1200);
            loan.loanPayInts = loan.loanPayInts ? [...loan.loanPayInts, interestPayment] : [interestPayment];
            // Update balance and duration (very simplified)
            loan.loanCurrBal = loan.loanCurrBal * (1 + (loan.loanCurrInt/1200)) - loan.loanCurrEMI;
            loan.loanCurrDur = loan.loanCurrDur - 1;
            if(loan.loanCurrDur <= 0 || loan.loanCurrBal <= 0){
              loan.loanStatus = "Closed";
              break;
            }
          }
        }
        return loan;
      });
      // Update user document with new loans and lastUpdate field
      try {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, "bank", uid);
        await updateDoc(userDocRef, {
          loans: updatedLoans,
          lastUpdate: currentMonthYear
        });
        // Update local state to reflect processed data
        setUserData({ ...userData, loans: updatedLoans, lastUpdate: currentMonthYear });
      } catch (err) {
        console.error("Error updating loans", err);
      }
    }
    setProcessingDone(true);
  };

  // Calculate metrics for yellow boxes from active loans (loanStatus === "Progress")
  const calculateMetrics = () => {
    if(!userData || !userData.loans) return { paymentDue: 0, totalLoan: 0, currentBalance: 0, monthsLeft: 0 };
    let paymentDue = 0, totalLoan = 0, currentBalance = 0, monthsLeft = 0;
    userData.loans.forEach(loan => {
      if(loan.loanStatus === "Progress"){
        paymentDue += Number(loan.loanCurrEMI || 0);
        totalLoan += Number(loan.loanPrincipal || 0);
        currentBalance += Number(loan.loanCurrBal || 0);
        monthsLeft = Math.max(monthsLeft, Number(loan.loanCurrDur || 0));
      }
    });
    return { paymentDue, totalLoan, currentBalance, monthsLeft };
  };

  const { paymentDue, totalLoan, currentBalance, monthsLeft } = calculateMetrics();
  // Due date: first day of month after current month
  const dueDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString();

  // Drawer selection for main area
  const [selectedDrawer, setSelectedDrawer] = useState("PaymentHistory");

  // For Payment History: selected loanId from dropdown and its arrays
  const [selectedLoanId, setSelectedLoanId] = useState("");
  // We assume userData.loans is an array of loan maps, each with loanId, loanPayments, loanPayDays, loanPayInts.
  // Default: loan with latest loanStartDate.
  useEffect(() => {
    if(userData && userData.loans && userData.loans.length > 0){
      // Sort loans by loanStartDate descending
      const sortedLoans = [...userData.loans].sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
      setSelectedLoanId(sortedLoans[0].loanId);
    }
  }, [userData]);

  return (
    <div className="min-h-screen w-full bg-blue-900 text-white">
      {/* App Bar & Drawer */}
      <AppBar position="static" className="bg-blue-900">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Wisemen Financials
          </Typography>
          {userData && (
            <Typography variant="body1">
              Welcome, {userData.firstName}!
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>

      {/* Yellow Boxes Section */}
      <Box className="bg-yellow-400 p-4" sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <Box className="flex items-center bg-white text-black p-2 m-1 rounded" sx={{ minWidth: 150 }}>
          {/* Icon placeholder */}
          <Box sx={{ mr: 1 }}>💸</Box>
          <Box>
            <Typography variant="subtitle1">Payment Due</Typography>
            <Typography variant="body2">${paymentDue.toFixed(2)}</Typography>
            <Typography variant="body2">Due: {dueDate}</Typography>
          </Box>
        </Box>
        <Box className="flex items-center bg-white text-black p-2 m-1 rounded" sx={{ minWidth: 150 }}>
          <Box sx={{ mr: 1 }}>💰</Box>
          <Box>
            <Typography variant="subtitle1">Total Loan</Typography>
            <Typography variant="body2">${totalLoan.toFixed(2)}</Typography>
          </Box>
        </Box>
        <Box className="flex items-center bg-white text-black p-2 m-1 rounded" sx={{ minWidth: 150 }}>
          <Box sx={{ mr: 1 }}>🏦</Box>
          <Box>
            <Typography variant="subtitle1">Current Balance</Typography>
            <Typography variant="body2">${currentBalance.toFixed(2)}</Typography>
          </Box>
        </Box>
        <Box className="flex items-center bg-white text-black p-2 m-1 rounded" sx={{ minWidth: 150 }}>
          <Box sx={{ mr: 1 }}>⏳</Box>
          <Box>
            <Typography variant="subtitle1">Months Left</Typography>
            <Typography variant="body2">{monthsLeft} months</Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Paper className="mx-auto my-4 p-4 bg-white text-black rounded" sx={{ maxWidth: 800 }}>
        {selectedDrawer === "PaymentHistory" && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Loan</InputLabel>
                <Select
                  label="Select Loan"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                >
                  {userData && userData.loans && userData.loans.map(loan => (
                    <MenuItem key={loan.loanId} value={loan.loanId}>
                      {loan.loanId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Interest</TableCell>
                    <TableCell>Principal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userData && userData.loans && (() => {
                    // Find selected loan
                    const loan = userData.loans.find(l => l.loanId === selectedLoanId);
                    if(loan && loan.loanPayDays && loan.loanPayments && loan.loanPayInts){
                      // Show last 5 records
                      const len = loan.loanPayDays.length;
                      const start = Math.max(0, len - 5);
                      return loan.loanPayDays.slice(start, len).map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{day}</TableCell>
                          <TableCell>{loan.loanPayments[start + index]}</TableCell>
                          <TableCell>{loan.loanPayInts[start + index]}</TableCell>
                          <TableCell>{(loan.loanPayments[start + index] - loan.loanPayInts[start + index]).toFixed(2)}</TableCell>
                        </TableRow>
                      ));
                    } else {
                      return (
                        <TableRow>
                          <TableCell colSpan={4}>No payment history available.</TableCell>
                        </TableRow>
                      );
                    }
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        {selectedDrawer === "LoanAgreement" && (
          <Box>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mb: 2 }}>
              <InputLabel>Select Loan</InputLabel>
              <Select
                label="Select Loan"
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
              >
                {userData && userData.loans && userData.loans.map(loan => (
                  <MenuItem key={loan.loanId} value={loan.loanId}>
                    {loan.loanId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={() => {
              // Placeholder: Download loan agreement PDF from Firebase Storage
              alert("Downloading Loan Agreement for " + selectedLoanId);
            }}>
              Get Loan Agreement
            </Button>
          </Box>
        )}
        {selectedDrawer === "ACHDetails" && (
          <Box>
            <Typography variant="body1">ACH details</Typography>
          </Box>
        )}
        {selectedDrawer === "LoanPayoff" && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Loan</InputLabel>
                <Select
                  label="Select Loan"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                >
                  {userData && userData.loans && userData.loans
                    .filter(loan => loan.loanStatus === "Progress")
                    .map(loan => (
                      <MenuItem key={loan.loanId} value={loan.loanId}>
                        {loan.loanId}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Date</InputLabel>
                <Select
                  label="Select Date"
                  value={selectedPayoffDate || ""}
                  onChange={(e) => setSelectedPayoffDate(e.target.value)}
                >
                  {(() => {
                    // Generate dates for current month based on number of days
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const dates = [];
                    for (let i = 1; i <= daysInMonth; i++) {
                      dates.push(i);
                    }
                    return dates.map(day => (
                      <MenuItem key={day} value={day}>{day}</MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </Box>
            <Button variant="contained" color="primary" onClick={() => {
              // For selected loan, calculate payoff value:
              // payoff = loanCurrBal*(1+loanCurrInt*(date-1)/(100*number of days in year))
              if(userData && userData.loans){
                const loan = userData.loans.find(l => l.loanId === selectedLoanId);
                if(loan){
                  const now = new Date();
                  const daysInYear = now.getFullYear() % 4 === 0 ? 366 : 365;
                  const payoff = Number(loan.loanCurrBal || 0) * (1 + Number(loan.loanCurrInt || 0) * (selectedPayoffDate - 1) / (100 * daysInYear));
                  alert("Loan Payoff Value: " + payoff.toFixed(2));
                }
              }
            }}>
              Calculate Loan Payoff
            </Button>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default Dashboard;
