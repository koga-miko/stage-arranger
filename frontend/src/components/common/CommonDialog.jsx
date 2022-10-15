import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

const CommonDialog = (props) => {
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  return (
    <div>
      <Dialog
        open={open}
        keepMounted
        onClose={() => props.doNo()}
        aria-labelledby="common-dialog-title"
        aria-describedby="common-dialog-description"
      >
        <DialogContent>{props.msg}</DialogContent>
        <DialogActions>
          <Button onClick={() => props.doYes()} color="primary">
            はい
          </Button>
          <Button onClick={() => props.doNo()} color="primary">
            いいえ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CommonDialog;
