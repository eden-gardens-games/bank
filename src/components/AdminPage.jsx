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
  const [yearError, setYearError] = useState("");
  const [extensionError, setExtensionError] = useState("");
  const [foreclosureError, setForeclosureError] = useState("");
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
            Update Records   |
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Filters Section */}
     <div className="p-4 flex flex-wrap gap-4 bg-yellow-400 text-white">
	  <FormControl variant="outlined" size="small" style={{ minWidth: 220}}>
		<TextField 
		  label="Year" 
		  value={filterYear} 
		  onChange={(e) => {
            const val = e.target.value;
            // Only validate if value is not empty
            if (val !== "" && (Number(val) < 1900 || Number(val) > 2200)) {
              setYearError("Year must be between 1900 and 2200");
            } else {
              setYearError("");
            }
            setFilterYear(val);
          }}
		  error={!!yearError}
          helperText={yearError}
          inputProps={{ min: 1900, max: 2200 }}		  
		  type="number"
		  InputLabelProps={{
			sx: {
			  // Apply this transform only when the label is not shrunk (i.e., initial state)
			  '&:not(.MuiInputLabel-shrink)': {
				transform: 'translate(14px, 10px) scale(1)',
			  },
			},
		  }}
		  sx={{ height: 40, "& .MuiInputBase-root": { height: 40 } }} 
		/>
	  </FormControl>
	  
	  <FormControl variant="outlined" size="small" style={{ minWidth: 180, height: 40 }}>
		<InputLabel>Loan Status</InputLabel>
		<Select
		  label="Loan Status"
		  value={filterStatus}
		  onChange={(e) => setFilterStatus(e.target.value)}
		  sx={{ height: 40, "& .MuiInputBase-root": { height: 40 } }} 
		>
		  <MenuItem value=""><em>None</em></MenuItem>
		  <MenuItem value="Approved">Approved</MenuItem>
		  <MenuItem value="Progress">Progress</MenuItem>
		  <MenuItem value="Closed">Closed</MenuItem>
		</Select>
	  </FormControl>

	  <FormControl variant="outlined" size="small" style={{ minWidth: 180, height: 40 }}>
		<TextField 
		  label="Loan Extension (months)" 
		  value={filterExtension} 
		  onChange={(e) => {
            const val = e.target.value;
            if (val !== "" && Number(val) < 0) {
              setExtensionError("Value cannot be less than 0");
            } else {
              setExtensionError("");
            }
            setFilterExtension(val);
          }} 
          type="number"
          error={!!extensionError}
          helperText={extensionError}
          inputProps={{ min: 0 }}
		  InputLabelProps={{
			sx: {
			  // Apply this transform only when the label is not shrunk (i.e., initial state)
			  '&:not(.MuiInputLabel-shrink)': {
				transform: 'translate(14px, 10px) scale(1)',
			  },
			},
		  }}
		  sx={{ height: 40, "& .MuiInputBase-root": { height: 40 } }} 
		/>
	  </FormControl>

	  <FormControl variant="outlined" size="small" style={{ minWidth: 180, height: 40 }}>
		<TextField 
		  label="Loan Foreclosure (months)" 
		  value={filterForeclosure} 
		  onChange={(e) => {
            const val = e.target.value;
            if (val !== "" && Number(val) < 0) {
              setForeclosureError("Value cannot be less than 0");
            } else {
              setForeclosureError("");
            }
            setFilterForeclosure(val);
          }} 
          type="number"
          error={!!foreclosureError}
          helperText={foreclosureError}
          inputProps={{ min: 0 }}
		  InputLabelProps={{
			sx: {
			  // Apply this transform only when the label is not shrunk (i.e., initial state)
			  '&:not(.MuiInputLabel-shrink)': {
				transform: 'translate(14px, 10px) scale(1)',
			  },
			},
		  }}
		  sx={{ height: 40, "& .MuiInputBase-root": { height: 40 } }} 
		/>
	  </FormControl>
	</div>


      {/* Loans Table */}
      <div className="p-4 text-white">
        <Paper className="overflow-auto">
          <TableContainer style={{ maxHeight: '70vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {/* First Column: User Name (sticky) */}
                  <TableCell 
                    style={{ 
                      backgroundColor: '#1E3A8A',
					  color: 'white',
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 2 
                    }}
                  >
                    User Name
                  </TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Email ID</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Date</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Principal</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Interest Rate</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Duration</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Status</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Extension</TableCell>
                  <TableCell style={{ backgroundColor: '#1E3A8A', color: 'white' }}>Loan Foreclosure</TableCell>
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
