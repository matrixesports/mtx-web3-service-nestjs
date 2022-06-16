import { Controller } from '@nestjs/common';

@Controller('redeemable')
export class RedeemableController {
  // router.post("/updateStatus", async (req, res) => {
  // let updateConfirm;
  // if (req.body.approved) {
  //     updateConfirm = await updateRedeemableStatus({
  //         status: "Redeemed",
  //         ticket_id: req.body.ticketId,
  //     });
  // } else {
  //     updateConfirm = await updateRedeemableStatus({
  //         status: "Rejected",
  //         ticket_id: req.body.ticketId,
  //     });
  // }
  // if (updateConfirm) {
  //     res.send({
  //         success: true,
  //     });
  // } else {
  //     res.send({
  //         success: false,
  //     });
  // }
}
