import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";

const AdminUpdate = () => {
	return (<div>Test</div>);
};

export default AdminUpdate;