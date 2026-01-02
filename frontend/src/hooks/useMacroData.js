import { useState, useEffect } from 'react';
import axios from 'axios';

const useMacroData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMacro = async () => {
            try {
                // Adjust URL if needed (port 8000)
                const response = await axios.get('http://localhost:8000/api/macro');
                setData(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch macro data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMacro();
    }, []);

    return { data, loading, error };
};

export default useMacroData;
