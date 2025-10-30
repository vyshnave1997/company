import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('companydb');
    const companies = await db.collection('companies')
      .find({})
      .sort({ serialNo: 1 })
      .toArray();
    
    // Convert MongoDB _id to string for JSON serialization
    const companiesData = companies.map(company => ({
      ...company,
      _id: company._id.toString()
    }));
    
    return NextResponse.json(companiesData);
  } catch (error) {
    console.error('Database GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('companydb');
    const body = await request.json();
    
    console.log('Saving company:', body);
    
    const result = await db.collection('companies').insertOne(body);
    
    return NextResponse.json({ 
      success: true, 
      insertedId: result.insertedId.toString() 
    });
  } catch (error) {
    console.error('Database POST error:', error);
    return NextResponse.json({ error: 'Failed to create company', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const client = await clientPromise;
    const db = client.db('companydb');
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    console.log('Updating company:', _id, updateData);
    
    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Database PUT error:', error);
    return NextResponse.json({ error: 'Failed to update company', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const client = await clientPromise;
    const db = client.db('companydb');
    const { searchParams } = new URL(request.url);
    const _id = searchParams.get('_id');
    
    console.log('Deleting company:', _id);
    
    const result = await db.collection('companies').deleteOne({ 
      _id: new ObjectId(_id) 
    });
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Database DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete company', details: error.message }, { status: 500 });
  }
}