'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BookOpen, Clock, Egg, AlertTriangle, Droplets, UtensilsCrossed, Shield, ThermometerSun, ClipboardCheck
} from 'lucide-react'

interface SOPItem {
  time: string
  task: string
  details: string
  icon?: React.ReactNode
}

const sopData = {
  'Morning Routine (6:00 AM)': [
    { time: '6:00 AM', task: 'Switch on lights in all poultry houses', details: 'Ensure adequate lighting for birds to start the day. Check for any blown bulbs and replace immediately.' },
    { time: '6:15 AM', task: 'Check water supply to all drinkers', details: 'Ensure all drinkers are filled, clean and flowing. Birds need constant access to fresh water. Check for leaks or blockages.' },
    { time: '6:30 AM', task: 'First feed distribution', details: 'Fill feeders with the appropriate feed type. Layer mash for layers, broiler starter/grower for broilers. Ensure even distribution.' },
    { time: '6:45 AM', task: 'Walk through all pens - Visual health check', details: 'Look for sick, injured or dead birds. Check for signs of lethargy, coughing, sneezing, diarrhoea, or abnormal behaviour. Note any findings.' },
    { time: '7:00 AM', task: 'Record any mortality found', details: 'Report all dead birds immediately. Record the number, suspected cause, house number, and notify the Vet Officer for investigation.' },
  ],
  'Mid-Morning (8:00 - 11:00 AM)': [
    { time: '8:00 AM', task: 'Egg collection (1st round)', details: 'Collect all laid eggs from nests. Handle carefully to avoid cracks. Sort into: good eggs, cracked eggs, and soiled eggs. Count crates.' },
    { time: '9:00 AM', task: 'Record egg collection', details: 'Enter the daily egg count in the system: number of crates, eggs per crate, broken eggs, and soiled eggs. Select the correct farm location.' },
    { time: '9:30 AM', task: 'Check house temperature and ventilation', details: 'Optimal temperature for layers is 20-25C. Open or close curtains/vents to regulate. Ensure no direct draughts on birds.' },
    { time: '10:00 AM', task: 'Clean and sanitise water drinkers', details: 'Empty, scrub, rinse and refill all drinkers. Use approved disinfectant. Biosecurity is critical to prevent disease spread.' },
    { time: '10:30 AM', task: 'Top up feed if needed', details: 'Check feeders and refill where empty. Layers should have feed available at all times for optimal production.' },
  ],
  'Afternoon (12:00 - 3:00 PM)': [
    { time: '12:00 PM', task: 'Egg collection (2nd round)', details: 'Collect the second batch of laid eggs. Handle with care. Add to morning collection total. Store in cool, dry area.' },
    { time: '1:00 PM', task: 'Second feed distribution', details: 'Refill feeders for afternoon feeding. Monitor feed consumption - sudden drop in feed intake can signal health problems.' },
    { time: '1:30 PM', task: 'Check litter condition', details: 'Litter should be dry and fluffy. Wet litter causes ammonia build-up and foot problems. Add fresh litter material if needed.' },
    { time: '2:00 PM', task: 'Record feed consumption', details: 'Log the number of bags used, feed type, and cost per bag in the system. This helps the Accountant track feed expenses.' },
    { time: '2:30 PM', task: 'Visual health check (2nd walk)', details: 'Another walkthrough to observe bird behaviour. Compare with morning observations. Report any worsening conditions.' },
  ],
  'Late Afternoon (3:00 - 5:30 PM)': [
    { time: '3:00 PM', task: 'Egg collection (3rd/final round)', details: 'Final egg collection of the day. Ensure all eggs are collected and stored properly. Update the total daily count in the system.' },
    { time: '4:00 PM', task: 'Clean poultry house floors', details: 'Remove wet or caked litter. Sweep walkways. Maintain hygiene to prevent disease and pest infestation.' },
    { time: '4:30 PM', task: 'Check and secure all doors and windows', details: 'Close and lock all entry points to protect against predators (rats, snakes, wild animals). Ensure no gaps in netting.' },
    { time: '5:00 PM', task: 'Final water check and top-up', details: 'Ensure all drinkers are full for the night. Birds will drink before roosting. Dehydration causes stress and reduced production.' },
    { time: '5:30 PM', task: 'Submit all daily records', details: 'Make sure all records for the day are entered: egg collections, mortality, feed usage. Report any issues to the supervisor.' },
  ],
  'Weekly Tasks': [
    { time: 'Weekly', task: 'Deep clean one poultry house section', details: 'Rotate deep cleaning through different sections. Remove all litter, wash floors and walls with disinfectant, and allow to dry before restocking.' },
    { time: 'Weekly', task: 'Check and maintain equipment', details: 'Inspect feeders, drinkers, nests, and ventilation systems. Repair or replace damaged items. Lubricate moving parts of automated systems.' },
    { time: 'Weekly', task: 'Review biosecurity measures', details: 'Check footbaths are filled with disinfectant. Ensure visitors log is maintained. Verify rodent control measures are in place.' },
  ],
  'Emergency Procedures': [
    { time: 'Emergency', task: 'Disease Outbreak', details: 'Immediately isolate affected birds. Notify the Vet Officer at once. Do not move birds between houses. Increase biosecurity measures. Record all observations.' },
    { time: 'Emergency', task: 'High Mortality (>5 birds/day)', details: 'Report immediately to the CEO and Vet Officer. Collect dead birds for examination. Do not dispose of dead birds without veterinary instruction.' },
    { time: 'Emergency', task: 'Feed or Water Supply Failure', details: 'Immediately contact the supplier and the CEO. Implement temporary measures. Birds should not go without feed for more than 4 hours or water for more than 2 hours.' },
    { time: 'Emergency', task: 'Predator Attack', details: 'Secure the house immediately. Count all birds and report losses. Identify entry point and reinforce. Set traps if necessary.' },
  ],
}

const iconMap: Record<string, React.ReactNode> = {
  'Egg': <Egg className="h-4 w-4 text-amber-500" />,
  'Health': <AlertTriangle className="h-4 w-4 text-red-500" />,
  'Water': <Droplets className="h-4 w-4 text-blue-500" />,
  'Feed': <UtensilsCrossed className="h-4 w-4 text-green-500" />,
  'Security': <Shield className="h-4 w-4 text-purple-500" />,
  'Emergency': <AlertTriangle className="h-4 w-4 text-red-600" />,
}

export function SOPSection() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-green-600" />
          Standard Operating Procedures (SOP)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-green-800 font-medium">Quick Reference Guide for Daily Farm Operations</p>
          <p className="text-[11px] text-green-700 mt-0.5">Follow these steps every day to maintain bird health, egg quality, and farm efficiency.</p>
        </div>
        <Accordion type="multiple" defaultValue={['Morning Routine (6:00 AM)', 'Mid-Morning (8:00 - 11:00 AM)']}>
          {Object.entries(sopData).map(([section, tasks]) => {
            const isEmergency = section === 'Emergency Procedures'
            return (
              <AccordionItem key={section} value={section}>
                <AccordionTrigger className={`text-sm font-medium py-2 ${isEmergency ? 'text-red-600' : ''}`}>
                  <span className="flex items-center gap-2">
                    {isEmergency ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4 text-gray-500" />}
                    {section}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {tasks.map((item, idx) => (
                      <div key={idx} className={`flex gap-3 p-2 rounded-lg ${isEmergency ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="text-[10px] font-mono text-gray-500 w-20 shrink-0 pt-0.5">{item.time}</div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{item.task}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{item.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}
