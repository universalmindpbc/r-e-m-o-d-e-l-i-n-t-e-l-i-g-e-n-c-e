import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignDefaults,validateCampaign} from '../app/campaign-config.ts';
test('campaign settings preserve dates and normalise unique topics',()=>{assert.deepEqual(validateCampaign({...campaignDefaults,topics:[' @rihanna ','@rihanna','climate justice']}),{...campaignDefaults,topics:['@rihanna','climate justice']});});
test('invalid windows, calendar dates and announcement dates are rejected',()=>{for(const edit of [{analysisEndDate:'2021-12-31'},{analysisStartDate:'2022-02-30'},{announcementDate:'2023-01-01'},{analysisStartDate:'not-a-date'}])assert.throws(()=>validateCampaign({...campaignDefaults,...edit}));});
test('empty, malformed and oversized inputs are rejected',()=>{for(const edit of [{name:' '},{topics:[]},{topics:[null]},{topics:['a'.repeat(81)]},{topics:['a'.repeat(80),'b'.repeat(80),'c'.repeat(30)]},{name:'a'.repeat(71)}])assert.throws(()=>validateCampaign({...campaignDefaults,...edit}));});
