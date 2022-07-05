const express = require('express')
const bodyParser  = require('body-parser');
const app = express()

app.use(bodyParser.json());

const port = process.env.PORT || 3000


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})


app.post('/split-payments-compute', (req, res) => {
    const {ID, Amount, Currency, CustomerEmail, SplitInfo} = req.body;

    let SplitBreakdown = SplitInfo
    let Balance = Amount;
    let newSplitBreakDown = [];


    //Break splits into separate categories based on splitType

    let FlatSplitBreakdown = SplitBreakdown.filter(el => el.SplitType == "FLAT");
    let PercentSplitBreakdown = SplitBreakdown.filter(el => el.SplitType == "PERCENTAGE");
    let RatioSplitBreakdown = SplitBreakdown.filter(el => el.SplitType == "RATIO");


    //Compute for Flat
    FlatSplitBreakdown.forEach(el => {
        Balance = Balance - el.SplitValue
        newSplitBreakDown.push({
            SplitEntityId: el.SplitEntityId,
            Amount: el.SplitValue
        })
    })

    //Compute for Percentage
    PercentSplitBreakdown.forEach(el => {
        let computedAmount = (el.SplitValue/100) * Balance;

        Balance = Balance - computedAmount;

        newSplitBreakDown.push({
            SplitEntityId: el.SplitEntityId,
            Amount: computedAmount
        })
    })

    //Compute for Ratio
    let sumOfRatios = RatioSplitBreakdown.reduce(
        (previousValue, currentValue) => previousValue.SplitValue + currentValue.SplitValue
    );

    if (RatioSplitBreakdown.length > 1) {
        sumOfRatios = sumOfRatios
    }

    else {
        sumOfRatios = sumOfRatios.SplitValue
    }

      
    RatioSplitBreakdown.forEach((el, index) => {

        let computedAmount = (el.SplitValue/sumOfRatios) * Balance;

        newSplitBreakDown.push({
            SplitEntityId: el.SplitEntityId,
            Amount: computedAmount
        })

        //update Balance when we are at the last Ratio item
        if (RatioSplitBreakdown.length - index == 1) {
            Balance = Balance - el.SplitValue;
        }
    })

    
    const resp = {
        ID,
        Balance,
        newSplitBreakDown
    }

    res.send(resp);
    
})