import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16,
      }}
    >
      {/* Previous button */}
      <TouchableOpacity
        onPress={handlePrev}
        disabled={currentPage === 1}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: currentPage === 1 ? '#ccc' : '#007bff',
          borderRadius: 8,
          marginHorizontal: 5,
        }}
      >
        <Text style={{ color: '#fff' }}>Prev</Text>
      </TouchableOpacity>

      {/* Current page info */}
      <Text style={{ marginHorizontal: 10, fontSize: 16 }}>
        {currentPage} / {totalPages}
      </Text>

      {/* Next button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={currentPage === totalPages}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: currentPage === totalPages ? '#ccc' : '#007bff',
          borderRadius: 8,
          marginHorizontal: 5,
        }}
      >
        <Text style={{ color: '#fff' }}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Pagination;
