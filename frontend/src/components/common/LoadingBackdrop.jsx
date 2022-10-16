import React, {useEffect} from 'react'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const LoadingBackdrop = (props) => {
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  return (
    <div>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}

export default LoadingBackdrop;