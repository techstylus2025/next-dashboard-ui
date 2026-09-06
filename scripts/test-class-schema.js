const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const mod = require('../src/lib/formValidationSchemas');
const classSchema = mod.classSchema;

function test(val){
  const res = classSchema.safeParse(val);
  console.log('input:', val, 'ok:', res.success);
  if(!res.success) console.log(res.error.issues);
}

test({ name: 'A', capacity: '10', gradeId: '1' });
test({ name: 'A', capacity: '10', gradeId: '' });
test({ name: 'A', capacity: '10' });
