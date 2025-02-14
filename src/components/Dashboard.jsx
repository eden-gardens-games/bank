import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase"; // Adjust the path if needed

// MUI Components
import { 
  AppBar, Toolbar, Typography, Button, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  FormControl, InputLabel, Select, MenuItem, TextField 
} from '@mui/material';

const AdminPage = () => {
  const navigate = useNavigate();

  // State for loan data
  const [loanData, setLoanData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Filter state
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExtension, setFilterExtension] = useState('');
  const [filterForeclosure, setFilterForeclosure] = useState('');

  // Fetch data from Firestore on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const bankCollectionRef = collection(db, "bank");
        const snapshot = await getDocs(bankCollectionRef);
        const loans = [];
        
        snapshot.forEach((docSnap) => {
          // Ignore the "admin" document
          if (docSnap.id === "admin") return;
          
          const data = docSnap.data();
          // If user has a non-empty loans array, process each loan
          if (data.loans && Array.isArray(data.loans) && data.loans.length > 0) {
            data.loans.forEach((loan) => {
              loans.push({
                userName: `${data.firstName || ''} ${data.lastName || ''}`,
                email: data.emailId || '',
                loanDate: loan.loanDate, // Expecting a date string or timestamp
                loanPrincipal: loan.loanPrincipal,
                loanInterestRate: loan.loanInterestRate,
                loanDuration: loan.loanDuration,
                loanStatus: loan.loanStatus,
                loanExtension: loan.loanExtension,
                loanForeclosure: loan.loanForeclosure,
              });
            });
          }
        });
        setLoanData(loans);
        setFilteredData(loans);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter state or loanData changes
  useEffect(() => {
    let data = [...loanData];

    // Filter by Year (assumes loanDate is parseable as Date)
    if (filterYear) {
      data = data.filter((loan) => {
        const loanYear = new Date(loan.loanDate).getFullYear();
        return loanYear.toString() === filterYear;
      });
    }
    // Filter by Loan Status
    if (filterStatus) {
      data = data.filter((loan) => loan.loanStatus === filterStatus);
    }
    // Filter by Loan Extension (months)
    if (filterExtension) {
      data = data.filter((loan) => loan.loanExtension == filterExtension);
    }
    // Filter by Loan Foreclosure (months)
    if (filterForeclosure) {
      data = data.filter((loan) => loan.loanForeclosure == filterForeclosure);
    }
    setFilteredData(data);
  }, [filterYear, filterStatus, filterExtension, filterForeclosure, loanData]);

  // Logout handler
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Navigate to Update Records page
  const handleUpdateRecords = () => {
    navigate("/update-records");
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white">
      {/* Top Bar */}
      <AppBar position="static" className="bg-blue-900">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Typography 
            variant="body1" 
            className="cursor-pointer mr-4"
            onClick={handleUpdateRecords}
          >
            Update Records
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Filters Section */}
      <div className="p-4 flex flex-wrap gap-4 bg-yellow-400 text-blue-900">
        <FormControl variant="outlined" size="small">
          <TextField 
            label="Year" 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)} 
            type="number"
          />
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Loan Status</InputLabel>
          <Select
            label="Loan Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Progress">Progress</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <TextField 
            label="Loan Extension (months)" 
            value={filterExtension} 
            onChange={(e) => setFilterExtension(e.target.value)} 
            type="number"
          />
        </FormControl>
        <FormControl variant="outlined" size="small">
          <TextField 
            label="Loan Foreclosure (months)" 
            value={filterForeclosure} 
            onChange={(e) => setFilterForeclosure(e.target.value)} 
            type="number"
          />
        </FormControl>
      </div>

      {/* Loans Table */}
      <div className="p-4">
        <Paper className="overflow-auto">
          <TableContainer style={{ maxHeight: '70vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {/* First Column: User Name (sticky) */}
                  <TableCell 
                    style={{ 
                      backgroundColor: '#1E3A8A', 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 2 
                    }}
                  >
                    User Name
                  </TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Email ID</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Date</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Principal</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Interest Rate</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Duration</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Status</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Extension</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A' }}>Loan Foreclosure</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((loan, index) => (
                  <TableRow key={index} hover>
                    <TableCell 
                      style={{ 
                        position: 'sticky', 
                        left: 0, 
                        backgroundColor: '#D4AF37' 
                      }}
                    >
                      {loan.userName}
                    </TableCell>
                    <TableCell>{loan.email}</TableCell>
                    <TableCell>{new Date(loan.loanDate).toLocaleDateString()}</TableCell>
                    <TableCell>{loan.loanPrincipal}</TableCell>
                    <TableCell>{loan.loanInterestRate}</TableCell>
                    <TableCell>{loan.loanDuration}</TableCell>
                    <TableCell>{loan.loanStatus}</TableCell>
                    <TableCell>{loan.loanExtension}</TableCell>
                    <TableCell>{loan.loanForeclosure}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </div>
  );
};

export default AdminPage;
