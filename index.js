
const express = require('express')
const cors = require('cors')
const jwt=require('jsonwebtoken')
const SSLCommerzPayment = require('sslcommerz-lts')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
 



const store_id = process.env.Store_ID;
const store_passwd = process.env.Store_Password;
const is_live = false //true for live, false for sandbox

app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c8jqjnz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function varifyJWT(req,res,next){
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorize'});
  }
  const token=authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, function(err, decoded) {
    if(err){
      return res.status(401).send({message:'unauthorize'});
    }
    req.decoded=decoded;
    next();
  });


}
async function run() {
    try {
      const serviceCollection=client.db('onlinecar').collection('services');
      const orderCollection=client.db('onlinecar').collection('orders');
      app.post('/jwt',(req,res)=>{
        const user=req.body;
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE,{expiresIn:'10h'})
        res.send({token})

      })  
      app.get('/services',async(req,res)=>{
            
            const query={};
            const cursor=serviceCollection.find(query);
            const services=await cursor.toArray();
            res.send(services)

        })

        app.get('/services/:id',async(req,res)=>{
          const id=req.params.id;
          const query={_id:ObjectId(id)}
          const service=await serviceCollection.findOne(query);
          res.send(service)
        })

        app.post('/orders',async(req,res)=>{
          const doc =req.body;
          const result=await orderCollection.insertOne(doc);
          res.send(result)

        })
        app.get('/orders',varifyJWT, async(req,res)=>{
          const decoded=req.decoded;
          if(!decoded.email===req.query.email){
            return res.status(403).send({message:'unauthorize'});
          }
          
          let query={};
        if(req.query.email){
          query = { email: req.query.email };

        }
          
          const cursor= orderCollection.find(query);
          const order=await cursor.toArray();
          res.send(order)

        })

        app.delete('/orders/:id',async(req,res)=>{
          const id=req.params.id;
          const query={_id:ObjectId(id)};
          const result=await orderCollection.deleteOne(query);
          res.send(result)

        })
        app.patch('/orders/:id',async(req,res)=>{
          const id=req.params.id;
          const status=req.body.status;
          const filter={_id:ObjectId(id)};
          const updateDoc={
            $set:{
           status:status
          }

        }
        const result=await orderCollection.updateOne(filter,updateDoc);
        res.send(result)
      })
    
 
      
    } finally {
      
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})