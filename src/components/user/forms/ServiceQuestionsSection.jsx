import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CircularProgress, Typography } from "@mui/material"
import { useGetServiceQuestionsQuery } from "../../../store/api/user/quoteApi"
import { ExpandMore } from "@mui/icons-material"

export const ServiceQuestionsSection = ({
    service,
    data,
    onUpdate,
    expandedService,
    setExpandedService,
    normalizeQuestion,
    renderQuestion,
    getAllQuestionsFlattened,
    shouldShowQuestion,
  }) => {
    const { data: serviceData, isLoading, isError, refetch } =
      useGetServiceQuestionsQuery(service.id, {
        skip: !service.id,
        refetchOnMountOrArgChange: true,
      })
  
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      )
    }
  
    if (isError) {
      return (
        <Alert
          severity="error"
          action={<Button onClick={refetch}>Retry</Button>}
        >
          Failed to load questions.
        </Alert>
      )
    }
  
   
  
    const normalizedQuestions = [...serviceData.questions]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((q) => normalizeQuestion(q))

  
    const isExpanded = expandedService === service.id
  
    return (
      <Accordion
        sx={{
          border: '1px solid #ddd',
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
          boxShadow: 'none',
        }}
        expanded={isExpanded}
        onChange={(e, expanded) =>
          setExpandedService(expanded ? service.id : null)
        }
      >
        <AccordionSummary 
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{
            backgroundColor: '#023c8f',
            color: 'white',
            borderRadius: '8px',
            minHeight: 44,
            '&.Mui-expanded': {
              minHeight: 44,
              borderRadius: '8px 8px 0 0'
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
            },
            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: 0,
            }
          }}
        >
          <Typography  variant="h6" sx={{ fontWeight: 500 }}>{serviceData.service.name}</Typography>
        </AccordionSummary>
  
        <AccordionDetails>
        {(!serviceData?.questions?.length) ? (
          <Typography sx={{ fontStyle: "italic" }}>
            No additional questions for this service.
          </Typography>
        ) :
          getAllQuestionsFlattened(normalizedQuestions)
            .filter((q) => shouldShowQuestion(q, service.id))
            .map((question) =>
              renderQuestion(question, service.id)
            )
      }
        </AccordionDetails>
      </Accordion>
    )
  }